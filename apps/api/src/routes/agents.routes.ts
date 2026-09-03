import { Hono } from "hono";
import {
  agentBuilderCreateSchema,
  agentBuilderUpdateSchema,
  cloneAgentSchema,
  paginationSchema,
  publishAgentSchema,
  reviewSchema,
  runAgentSchema,
  versionAgentSchema,
} from "@aihub/shared";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { failure, success } from "../lib/response";
import {
  addReview,
  cloneAgent,
  createAgent,
  createTransaction,
  deleteAgent,
  favoriteAgent,
  getAgentById,
  listAgentTools,
  listAgentVersions,
  listAgents,
  publishAgent,
  runAgent,
  settleTransaction,
  unfavoriteAgent,
  unpublishAgent,
  updateAgent,
  versionAgent,
} from "../services";
import { AgentModel, DeveloperModel, TransactionModel } from "../models";
import { env } from "../config/env";
import { createDemoExecution, demoDeveloperId, getDemoAgentById, updateDemoExecution } from "../lib/demo-store";
import { fetchAutonomousPaidJson } from "../lib/autonomous-payment";
import { getPaymentTransactionIdFromRequest } from "../lib/x402-payment";
import { ensureReceiptForExecution, createExecution, updateExecution } from "../services/execution.service";
import { executeAgentThroughN8n } from "../services/n8n.service";
import { syncX402RoutesNow } from "../x402/dynamic";

export function createAgentRoutes() {
  const app = new Hono();

  app.get("/agents", async c => {
    const query = paginationSchema.parse(Object.fromEntries(new URL(c.req.url).searchParams));
    const result = await listAgents(query);
    return c.json(success("Agents loaded", result));
  });

  app.get("/agents/:id", async c => {
    const agent = await getAgentById(c.req.param("id"));
    return c.json(success("Agent loaded", agent));
  });

  app.get("/agents/:id/versions", async c => {
    const versions = await listAgentVersions(c.req.param("id"));
    return c.json(success("Versions loaded", versions));
  });

  app.get("/agents/:id/tools", async c => {
    const tools = await listAgentTools(c.req.param("id"));
    return c.json(success("Tools loaded", tools));
  });

  // Create an agent via the Agent Builder (config-driven).
  app.post("/agents", authMiddleware, requireRole("developer", "admin"), async c => {
    const payload = agentBuilderCreateSchema.parse(await c.req.json());
    const auth = c.get("auth");
    if (env.DEMO_MODE) {
      const { config, ...basic } = payload;
      const agent = await createAgent(
        {
          ...basic,
          slug: basic.slug ?? `agent-${Date.now()}`,
          documentation: `# ${basic.name}\n\n${basic.description}`,
          endpoint: `https://aihub.market/agents/${basic.slug ?? `a-${Date.now()}`}`,
          price: config.pricing.pricePerRequest,
          currency: "USDC",
          inputSchema: {},
          outputSchema: {},
          screenshots: [],
          config,
        },
        demoDeveloperId,
      );
      return c.json(success("Agent created", agent), 201);
    }

    const developer = await DeveloperModel.findOne({ userId: auth.userId });
    if (!developer) {
      return c.json(failure("Developer profile not found"), 404);
    }

    const { config, ...basic } = payload;
    const agent = await createAgent(
      {
        ...basic,
        slug: basic.slug ?? `agent-${Date.now()}`,
        documentation: `# ${basic.name}\n\n${basic.description}`,
        endpoint: `https://aihub.market/agents/${basic.slug ?? `a-${Date.now()}`}`,
        price: config.pricing.pricePerRequest,
        currency: "USDC",
        inputSchema: {},
        outputSchema: {},
        screenshots: [],
        config,
      },
      String(developer._id),
    );
    return c.json(success("Agent created", agent), 201);
  });

  app.put("/agents/:id", authMiddleware, requireRole("developer", "admin"), async c => {
    const payload = agentBuilderUpdateSchema.parse(await c.req.json());
    const agentId = c.req.param("id")!;
    const agent = await updateAgent(agentId, payload);
    return c.json(success("Agent updated", agent));
  });

  app.delete("/agents/:id", authMiddleware, requireRole("developer", "admin"), async c => {
    const agentId = c.req.param("id")!;
    await deleteAgent(agentId);
    await syncX402RoutesNow();
    return c.json(success("Agent deleted", { id: agentId }));
  });

  app.post("/agents/:id/publish", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    const agentId = c.req.param("id")!;
    const body = publishAgentSchema.parse(await c.req.json().catch(() => ({})));
    const agent = await publishAgent(agentId, auth.userId, { price: body.price });
    await syncX402RoutesNow();
    return c.json(success("Agent published", agent));
  });

  app.post("/agents/:id/unpublish", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    const agentId = c.req.param("id")!;
    const agent = await unpublishAgent(agentId, auth.userId);
    await syncX402RoutesNow();
    return c.json(success("Agent unpublished", agent));
  });

  app.post("/agents/:id/clone", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    const agentId = c.req.param("id")!;
    const body = cloneAgentSchema.parse(await c.req.json().catch(() => ({})));
    const clone = await cloneAgent(agentId, env.DEMO_MODE ? demoDeveloperId : auth.userId, {
      name: body.name,
      slug: body.slug,
    });
    return c.json(success("Agent cloned", clone), 201);
  });

  app.post("/agents/:id/versions", authMiddleware, requireRole("developer", "admin"), async c => {
    const auth = c.get("auth");
    const agentId = c.req.param("id")!;
    const body = versionAgentSchema.parse(await c.req.json());
    const result = await versionAgent(agentId, env.DEMO_MODE ? demoDeveloperId : auth.userId, body);
    return c.json(success("Version created", result), 201);
  });

  app.post("/agents/:id/run", authMiddleware, async c => {
    try {
      const payload = runAgentSchema.parse(await c.req.json());
      const auth = c.get("auth");
      const agentId = c.req.param("id")!;
      const paymentTxIdFromRequest = getPaymentTransactionIdFromRequest(c.req.raw.headers);

      if (env.DEMO_MODE) {
        const agent = getDemoAgentById(agentId);
        if (!agent) {
          return c.json(failure("Agent not found"), 404);
        }

        const draft = {
          agentId: agent._id,
          userId: auth.userId,
          developerId: demoDeveloperId,
          amount: agent.price,
          network: "algorand:testnet" as const,
          walletAddress: auth.walletAddress ?? "",
        };
        c.set("paymentDraft", draft);

        const transaction = await createTransaction(draft);
        c.set("transactionId", String(transaction._id));

        const executionId = `demo-exec-${String(transaction._id).slice(-8)}`;
        const demoExecution = createDemoExecution({
          executionId,
          userId: auth.userId,
          agentId: String(agent._id),
          agentVersion: agent.versions.find(version => version.active)?.version ?? agent.versions[0]?.version,
          transactionId: String(transaction._id),
          paymentAmount: agent.price,
          currency: "USDC",
          input: payload.input,
          walletAddress: auth.walletAddress ?? "",
          paymentVerified: true,
          status: "PAYMENT_VERIFIED",
          metadata: {
            agentName: agent.name,
            n8nWorkflowId: agent.config?.n8nWorkflowId ?? "",
          },
        });

        updateDemoExecution(executionId, {
          status: "EXECUTING",
          paymentVerified: true,
        });

        const n8nResult = await executeAgentThroughN8n({
          executionId,
          agentId: String(agent._id),
          agentVersion: agent.versions.find(version => version.active)?.version ?? agent.versions[0]?.version,
          userId: auth.userId,
          walletAddress: auth.walletAddress ?? "",
          transactionId: String(transaction._id),
          amount: agent.price,
          input: payload.input,
          agent: agent as never,
        });
        const n8nSuccess = n8nResult as {
          success: true;
          executionId: string;
          agentId: string;
          result: Record<string, unknown>;
          usage?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        };

        const paymentTxId = paymentTxIdFromRequest ?? `demo-tx-${String(transaction._id).slice(-8)}`;
        const receipt = await settleTransaction(String(transaction._id), paymentTxId);
        const finalExecution = updateDemoExecution(executionId, {
          status: "COMPLETED",
          output: n8nSuccess.result,
          n8nExecutionId: n8nSuccess.executionId,
          completedAt: new Date().toISOString(),
          metadata: n8nSuccess.metadata ?? {},
        }) ?? demoExecution;

        return c.json(
          success("Agent execution completed", {
            execution: finalExecution,
            transaction: { ...transaction, status: "settled", txId: paymentTxId },
            receipt,
            result: n8nSuccess.result,
            usage: n8nSuccess.usage ?? {},
            metadata: n8nSuccess.metadata ?? {},
          }),
          200,
          {
            "PAYMENT-RESPONSE": Buffer.from(JSON.stringify({ transaction: paymentTxId })).toString("base64"),
          },
        );
      }

      const agent = await AgentModel.findById(agentId);
      if (!agent) {
        return c.json(failure("Agent not found"), 404);
      }
      if (agent.status !== "approved") {
        return c.json(failure("Agent is not approved for paid runs"), 403);
      }

      const draft = {
        agentId: String(agent._id),
        userId: auth.userId,
        developerId: String(agent.ownerDeveloperId),
        amount: agent.price,
        network: "algorand:testnet" as const,
        walletAddress: auth.walletAddress ?? "",
      };
      c.set("paymentDraft", draft);

      const transaction = await createTransaction(draft);
      c.set("transactionId", String(transaction._id));

      const paymentTxId = paymentTxIdFromRequest ?? `tx-${String(transaction._id).slice(-8)}`;
      await TransactionModel.findByIdAndUpdate(transaction._id, {
        status: "verified",
        txId: paymentTxId,
        paymentVerified: true,
      });

      const execution = await createExecution({
        userId: auth.userId,
        agentId: String(agent._id),
        agentVersion: agent.versions.find(version => version.active)?.version ?? agent.versions[0]?.version,
        transactionId: String(transaction._id),
        paymentAmount: agent.price,
        currency: "USDC",
        input: payload.input,
        walletAddress: auth.walletAddress ?? "",
        paymentVerified: true,
        status: "PAYMENT_VERIFIED",
        metadata: {
          agentName: agent.name,
          n8nWorkflowId: agent.config?.n8nWorkflowId ?? "",
        },
      });

      await updateExecution(execution.executionId, {
        status: "EXECUTING",
        paymentVerified: true,
      });

      const n8nResult = await executeAgentThroughN8n({
        executionId: execution.executionId,
        agentId: String(agent._id),
        agentVersion: execution.agentVersion ?? undefined,
        userId: auth.userId,
        walletAddress: auth.walletAddress ?? "",
        transactionId: String(transaction._id),
        amount: agent.price,
        input: payload.input,
        agent: agent as never,
      });

      if (!n8nResult.success) {
        await updateExecution(execution.executionId, {
          status: "FAILED",
          error: n8nResult.error.message,
          completedAt: new Date(),
        });
        await TransactionModel.findByIdAndUpdate(transaction._id, {
          status: "failed",
          errorMessage: n8nResult.error.message,
        });
        return c.json(failure(n8nResult.error.message, { code: n8nResult.error.code, executionId: execution.executionId }), 502);
      }

      const n8nSuccess = n8nResult as {
        success: true;
        executionId: string;
        agentId: string;
        result: Record<string, unknown>;
        usage?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      };

      const receipt = await settleTransaction(String(transaction._id), paymentTxId);
      const completedExecution = await updateExecution(execution.executionId, {
        status: "COMPLETED",
        output: n8nSuccess.result,
        n8nExecutionId: n8nSuccess.executionId,
        completedAt: new Date(),
        metadata: n8nSuccess.metadata ?? {},
      });

      const transactionRecord = await TransactionModel.findById(transaction._id).lean();
      return c.json(
        success("Agent execution completed", {
          execution: completedExecution ?? execution,
          transaction: transactionRecord,
          receipt,
          result: n8nSuccess.result,
          usage: n8nSuccess.usage ?? {},
          metadata: n8nSuccess.metadata ?? {},
        }),
        200,
        {
          "PAYMENT-RESPONSE": Buffer.from(JSON.stringify({ transaction: paymentTxId })).toString("base64"),
        },
      );
    } catch (error) {
      console.error("[agents.run] failed:", error);
      const message = error instanceof Error ? error.message : "Agent run failed";
      return c.json(failure(message, { detail: "Run endpoint failed before completion" }), 500);
    }
  });

  app.post("/agents/:id/run-autonomous", authMiddleware, async c => {
    try {
      const payload = runAgentSchema.parse(await c.req.json());
      const agentId = c.req.param("id")!;
      const authorization = c.req.header("authorization");
      const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

      if (!accessToken) {
        return c.json(failure("Missing bearer token"), 401);
      }

      const resourceUrl = new URL(`/agents/${agentId}/run`, c.req.url).toString();
      const { response, paymentResponse } = await fetchAutonomousPaidJson(resourceUrl, accessToken, payload.input);
      const body = await response.json().catch(() => null);

      return c.json(body, response.status as never, {
        ...(paymentResponse ? { "PAYMENT-RESPONSE": paymentResponse } : {}),
      });
    } catch (error) {
      console.error("[agents.run-autonomous] failed:", error);
      const message = error instanceof Error ? error.message : "Autonomous agent run failed";
      return c.json(failure(message, { detail: "Autonomous paid run failed before completion" }), 500);
    }
  });

  app.post("/agents/:id/favorite", authMiddleware, async c => {
    const auth = c.get("auth");
    const agentId = c.req.param("id")!;
    await favoriteAgent(auth.userId, agentId);
    return c.json(success("Agent favorited", { agentId }));
  });

  app.delete("/agents/:id/favorite", authMiddleware, async c => {
    const auth = c.get("auth");
    const agentId = c.req.param("id")!;
    await unfavoriteAgent(auth.userId, agentId);
    return c.json(success("Agent unfavorited", { agentId }));
  });

  app.post("/agents/:id/reviews", authMiddleware, async c => {
    const agentId = c.req.param("id")!;
    const payload = reviewSchema.parse({ ...(await c.req.json()), agentId });
    const auth = c.get("auth");
    const review = await addReview({ ...payload, userId: auth.userId });
    return c.json(success("Review saved", review), 201);
  });

  return app;
}
