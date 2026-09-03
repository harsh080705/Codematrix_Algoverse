import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { failure, success } from "../lib/response";
import { AgentModel, CategoryModel, DeveloperModel, ExecutionModel, TransactionModel, UserModel } from "../models";
import { approveDeveloper, updateAgent } from "../services";
import { env } from "../config/env";
import { demoAgents, demoDeveloperId, demoExecutions, demoTransactions, demoUsers } from "../lib/demo-store";
import { syncX402RoutesNow } from "../x402/dynamic";

export function createAdminRoutes() {
  const app = new Hono();

  app.get("/admin/analytics", authMiddleware, requireRole("admin"), async c => {
    if (env.DEMO_MODE) {
      return c.json(success("Admin analytics", {
        users: demoUsers.length,
        developers: 1,
        agents: demoAgents.length,
        transactions: demoTransactions.length,
        categories: new Set(demoAgents.map(agent => agent.category)).size,
      }));
    }

    const [users, developers, agents, transactions, categories] = await Promise.all([
      UserModel.countDocuments(),
      DeveloperModel.countDocuments(),
      AgentModel.countDocuments(),
      TransactionModel.countDocuments(),
      CategoryModel.countDocuments(),
    ]);

    return c.json(success("Admin analytics", { users, developers, agents, transactions, categories }));
  });

  app.get("/admin/users", authMiddleware, requireRole("admin"), async c => {
    if (env.DEMO_MODE) {
      return c.json(success("Users loaded", demoUsers));
    }

    const users = await UserModel.find().sort({ createdAt: -1 }).lean();
    return c.json(success("Users loaded", users));
  });

  app.get("/admin/developers", authMiddleware, requireRole("admin"), async c => {
    if (env.DEMO_MODE) {
      return c.json(
        success("Developers loaded", [
          {
            _id: demoDeveloperId,
            fullName: "Demo Developer",
            email: "developer@aihub.com",
            approved: true,
            companyName: "AlgoVerse Studio",
            bio: "Building pay-per-use AI agents on Algorand",
            createdAt: new Date().toISOString(),
          },
        ]),
      );
    }

    const developers = await DeveloperModel.find().populate("userId", "name email role status").sort({ createdAt: -1 }).lean();
    return c.json(success("Developers loaded", developers));
  });

  app.get("/admin/payments", authMiddleware, requireRole("admin"), async c => {
    if (env.DEMO_MODE) {
      return c.json(success("Payments loaded", demoTransactions));
    }

    const payments = await TransactionModel.find().sort({ createdAt: -1 }).limit(100).lean();
    return c.json(success("Payments loaded", payments));
  });

  app.get("/admin/executions", authMiddleware, requireRole("admin"), async c => {
    if (env.DEMO_MODE) {
      return c.json(success("Executions loaded", demoExecutions));
    }

    const executions = await ExecutionModel.find().sort({ createdAt: -1 }).limit(100).lean();
    return c.json(success("Executions loaded", executions));
  });

  // Admin: list all agents (for moderation).
  app.get("/admin/agents", authMiddleware, requireRole("admin"), async c => {
    if (env.DEMO_MODE) {
      return c.json(success("Agents loaded", demoAgents));
    }
    const agents = await AgentModel.find().sort({ createdAt: -1 }).lean();
    return c.json(success("Agents loaded", agents));
  });

  // Admin: approve an agent (make it live in marketplace + x402).
  app.post("/admin/agents/:id/approve", authMiddleware, requireRole("admin"), async c => {
    const agentId = c.req.param("id")!;
    if (env.DEMO_MODE) {
      const agent = demoAgents.find(item => item._id === agentId);
      if (agent) agent.status = "approved";
      await syncX402RoutesNow();
      return c.json(success("Agent approved", { id: agentId, status: "approved" }));
    }
    const agent = await updateAgent(agentId, { status: "approved", disabledReason: undefined });
    await syncX402RoutesNow();
    return c.json(success("Agent approved", agent));
  });

  // Admin: reject an agent (set to disabled with a reason).
  app.post("/admin/agents/:id/reject", authMiddleware, requireRole("admin"), async c => {
    const agentId = c.req.param("id")!;
    const { reason } = await c.req.json().catch(() => ({}));
    if (env.DEMO_MODE) {
      const agent = demoAgents.find(item => item._id === agentId);
      if (agent) {
        agent.status = "disabled";
        agent.disabledReason = reason ?? "Rejected by admin";
      }
      await syncX402RoutesNow();
      return c.json(success("Agent rejected", { id: agentId, status: "disabled" }));
    }
    const agent = await updateAgent(agentId, { status: "disabled", disabledReason: reason ?? "Rejected by admin" });
    await syncX402RoutesNow();
    return c.json(success("Agent rejected", agent));
  });

  // Admin: feature/unfeature an agent.
  app.post("/admin/agents/:id/feature", authMiddleware, requireRole("admin"), async c => {
    const agentId = c.req.param("id")!;
    const { featured } = await c.req.json().catch(() => ({ featured: true }));
    if (env.DEMO_MODE) {
      const agent = demoAgents.find(item => item._id === agentId);
      if (agent) agent.featured = !!featured;
      return c.json(success("Agent updated", { id: agentId, featured: !!featured }));
    }
    const agent = await updateAgent(agentId, { featured: !!featured });
    return c.json(success("Agent updated", agent));
  });

  // Admin: ban/unban developer.
  app.post("/admin/developers/:id/ban", authMiddleware, requireRole("admin"), async c => {
    const developerId = c.req.param("id")!;
    const { banned } = await c.req.json().catch(() => ({ banned: true }));
    if (env.DEMO_MODE) {
      return c.json(success("Developer updated", { id: developerId, banned: !!banned }));
    }
    const user = await DeveloperModel.findById(developerId).select("userId").lean();
    if (user) {
      await UserModel.findByIdAndUpdate(user.userId, { status: banned ? "suspended" : "active" });
    }
    const developer = await DeveloperModel.findByIdAndUpdate(
      developerId,
      { approved: !banned },
      { new: true },
    );
    return c.json(success("Developer updated", developer));
  });

  app.post("/admin/developers/:id/approve", authMiddleware, requireRole("admin"), async c => {
    if (env.DEMO_MODE) {
      return c.json(success("Developer approved", {
        _id: c.req.param("id")!,
        approved: true,
        approvedAt: new Date().toISOString(),
      }));
    }

    const developer = await approveDeveloper(c.req.param("id")!);
    return c.json(success("Developer approved", developer));
  });

  app.put("/admin/categories", authMiddleware, requireRole("admin"), async c => {
    const { categories } = await c.req.json();
    if (env.DEMO_MODE) {
      return c.json(success("Categories updated", categories));
    }

    const saved = await Promise.all(
      (categories as Array<{ name: string; slug: string; description: string; icon?: string }>).map(category =>
        CategoryModel.updateOne({ slug: category.slug }, { ...category, active: true }, { upsert: true }),
      ),
    );
    return c.json(success("Categories updated", saved));
  });

  app.delete("/admin/agents/:id", authMiddleware, requireRole("admin"), async c => {
    const agentId = c.req.param("id")!;
    if (env.DEMO_MODE) {
      const agent = demoAgents.find(item => item._id === agentId);
      if (agent) {
        agent.status = "disabled";
      }
      await syncX402RoutesNow();
      return c.json(success("Agent removed", { id: agentId }));
    }

    await AgentModel.findByIdAndDelete(agentId);
    await syncX402RoutesNow();
    return c.json(success("Agent removed", { id: agentId }));
  });

  return app;
}
