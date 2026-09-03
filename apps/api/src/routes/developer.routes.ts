import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { failure, success } from "../lib/response";
import { AgentModel, DeveloperModel, ExecutionLogModel, ReviewModel, TransactionModel } from "../models";
import { env } from "../config/env";
import { updateAgent } from "../services";
import { demoAgents, demoDeveloperId, demoTransactions } from "../lib/demo-store";

export function createDeveloperRoutes() {
  const app = new Hono();

  app.get("/developer/dashboard", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    if (env.DEMO_MODE) {
      const agents = demoAgents.filter(agent => agent.ownerDeveloperId === demoDeveloperId);
      const transactions = demoTransactions.filter(tx => tx.developerId === demoDeveloperId);

      return c.json(success("Developer dashboard", {
        developer: {
          _id: demoDeveloperId,
          userId: auth.userId,
          companyName: "Nova Labs",
          bio: "Demo publisher for AIHub sample agents.",
          payoutAddress: auth.walletAddress ?? "",
          approved: true,
          approvedAt: new Date().toISOString(),
          totalRevenue: transactions.reduce((sum, tx) => sum + tx.amount, 0),
          totalUsage: transactions.length,
          averageRating: 4.8,
          totalRatings: 12,
          categories: ["career", "research", "design"],
        },
        agents,
        transactions,
      }));
    }

    const developer = await DeveloperModel.findOne({ userId: auth.userId }).lean();
    if (!developer) return c.json(failure("Developer profile not found"), 404);

    const [agents, transactions] = await Promise.all([
      AgentModel.find({ ownerDeveloperId: developer._id }).sort({ createdAt: -1 }).lean(),
      TransactionModel.find({ developerId: developer._id }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return c.json(success("Developer dashboard", { developer, agents, transactions }));
  });

  // Developer analytics: revenue, requests, avg response time, tokens, tool usage, success/error rates.
  app.get("/developer/analytics", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    if (env.DEMO_MODE) {
      return c.json(success("Developer analytics", {
        revenue: demoTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        requests: demoTransactions.length,
        averageResponseTime: 120,
        tokensUsed: 0,
        successRate: 100,
        errorRate: 0,
        topAgents: demoAgents.slice(0, 5),
        topUsers: [],
        usageByDay: [],
      }));
    }

    const developer = await DeveloperModel.findOne({ userId: auth.userId }).lean();
    if (!developer) return c.json(failure("Developer profile not found"), 404);

    const agentIds = (await AgentModel.find({ ownerDeveloperId: developer._id }).select("_id").lean()).map(a => a._id);

    const [revenueAgg, requestCount, latencies, tokenAgg, toolAgg, successAgg, errorAgg] = await Promise.all([
      TransactionModel.aggregate([
        { $match: { developerId: developer._id, status: { $in: ["settled", "verified"] } } },
        { $group: { _id: null, revenue: { $sum: "$amount" } } },
      ]),
      ExecutionLogModel.countDocuments({ agentId: { $in: agentIds } }),
      ExecutionLogModel.aggregate([
        { $match: { agentId: { $in: agentIds } } },
        { $group: { _id: null, avg: { $avg: "$latencyMs" } } },
      ]),
      ExecutionLogModel.aggregate([
        { $match: { agentId: { $in: agentIds } } },
        { $group: { _id: null, tokens: { $sum: "$tokensUsed" } } },
      ]),
      ExecutionLogModel.aggregate([
        { $match: { agentId: { $in: agentIds } } },
        { $unwind: "$toolsUsed" },
        { $group: { _id: "$toolsUsed", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ExecutionLogModel.countDocuments({ agentId: { $in: agentIds }, status: "success" }),
      ExecutionLogModel.countDocuments({ agentId: { $in: agentIds }, status: "error" }),
    ]);

    const successRate = requestCount === 0 ? 100 : Number(((successAgg / requestCount) * 100).toFixed(1));
    const errorRate = requestCount === 0 ? 0 : Number(((errorAgg / requestCount) * 100).toFixed(1));

    return c.json(success("Developer analytics", {
      revenue: revenueAgg[0]?.revenue ?? 0,
      requests: requestCount,
      averageResponseTime: Math.round(latencies[0]?.avg ?? 0),
      tokensUsed: tokenAgg[0]?.tokens ?? 0,
      successRate,
      errorRate,
      toolUsage: toolAgg.map(item => ({ tool: item._id as string, count: item.count as number })),
      topAgents: await AgentModel.find({ ownerDeveloperId: developer._id }).sort({ totalRuns: -1 }).limit(5).lean(),
      topUsers: await ExecutionLogModel.aggregate([
        { $match: { agentId: { $in: agentIds }, userId: { $ne: null } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    }));
  });

  // Developer revenue overview.
  app.get("/developer/revenue", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    if (env.DEMO_MODE) {
      return c.json(success("Developer revenue", {
        totalRevenue: demoTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        transactions: demoTransactions,
      }));
    }

    const developer = await DeveloperModel.findOne({ userId: auth.userId }).lean();
    if (!developer) return c.json(failure("Developer profile not found"), 404);

    const transactions = await TransactionModel.find({ developerId: developer._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return c.json(success("Developer revenue", {
      totalRevenue: developer.totalRevenue,
      transactions,
    }));
  });

  // Transactions for the developer's agents.
  app.get("/developer/transactions", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    if (env.DEMO_MODE) {
      return c.json(success("Transactions loaded", demoTransactions.filter(tx => tx.developerId === demoDeveloperId)));
    }

    const developer = await DeveloperModel.findOne({ userId: auth.userId }).lean();
    if (!developer) return c.json(failure("Developer profile not found"), 404);

    const transactions = await TransactionModel.find({ developerId: developer._id }).sort({ createdAt: -1 }).lean();
    return c.json(success("Transactions loaded", transactions));
  });

  // Reviews/ratings for the developer's agents.
  app.get("/developer/reviews", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    if (env.DEMO_MODE) {
      return c.json(success("Reviews loaded", []));
    }

    const developer = await DeveloperModel.findOne({ userId: auth.userId }).lean();
    if (!developer) return c.json(failure("Developer profile not found"), 404);

    const agentIds = (await AgentModel.find({ ownerDeveloperId: developer._id }).select("_id").lean()).map(a => a._id);
    const reviews = await ReviewModel.find({ agentId: { $in: agentIds } }).populate("userId", "fullName").sort({ createdAt: -1 }).lean();
    return c.json(success("Reviews loaded", reviews));
  });

  // Agent API usage / execution logs.
  app.get("/developer/api-usage", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    if (env.DEMO_MODE) {
      return c.json(success("API usage loaded", []));
    }

    const developer = await DeveloperModel.findOne({ userId: auth.userId }).lean();
    if (!developer) return c.json(failure("Developer profile not found"), 404);

    const agentIds = (await AgentModel.find({ ownerDeveloperId: developer._id }).select("_id").lean()).map(a => a._id);
    const logs = await ExecutionLogModel.find({ agentId: { $in: agentIds } }).sort({ createdAt: -1 }).limit(100).lean();
    return c.json(success("API usage loaded", logs));
  });

  app.put("/developer/agents/:id/pricing", authMiddleware, requireRole("developer", "admin"), async c => {
    const { price } = await c.req.json();
    const agent = await updateAgent(c.req.param("id")!, { price, commissionRate: 0.1, developerShare: 0.9, marketplaceShare: 0.1 });
    return c.json(success("Pricing updated", agent));
  });

  app.put("/developer/agents/:id/documentation", authMiddleware, requireRole("developer", "admin"), async c => {
    const { documentation } = await c.req.json();
    const agent = await updateAgent(c.req.param("id")!, { documentation });
    return c.json(success("Documentation updated", agent));
  });

  app.put("/developer/agents/:id/endpoint", authMiddleware, requireRole("developer", "admin"), async c => {
    const { endpoint } = await c.req.json();
    const agent = await updateAgent(c.req.param("id")!, { endpoint });
    return c.json(success("Endpoint updated", agent));
  });

  app.put("/developer/agents/:id/disable", authMiddleware, requireRole("developer", "admin"), async c => {
    const { reason } = await c.req.json();
    const agent = await updateAgent(c.req.param("id")!, { status: "disabled", disabledReason: reason ?? "Disabled by developer" });
    return c.json(success("Agent disabled", agent));
  });

  app.post("/developer/approve/:id", authMiddleware, requireRole("admin"), async c => {
    const { approveDeveloper } = await import("../services");
    const developer = await approveDeveloper(c.req.param("id")!);
    return c.json(success("Developer approved", developer));
  });

  return app;
}
