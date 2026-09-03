import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { success } from "../lib/response";
import { AgentModel, ReceiptModel, TransactionModel } from "../models";
import { env } from "../config/env";
import { buildChargeForAgent, createTransaction } from "../services";
import { demoAgents, demoReceipts, demoTransactions, getDemoAgentById } from "../lib/demo-store";

export function createPaymentRoutes() {
  const app = new Hono();

  app.post("/payments", authMiddleware, async c => {
    const { agentId, network, walletAddress } = await c.req.json();
    if (env.DEMO_MODE) {
      const agent = getDemoAgentById(agentId);
      if (!agent) {
        return c.json({ success: false, message: "Agent not found", data: {} }, 404);
      }

      const charge = buildChargeForAgent(agent as never);
      const transaction = await createTransaction({
        agentId,
        userId: (c.get("auth") as { userId: string }).userId,
        developerId: String(agent.ownerDeveloperId),
        walletAddress: String(walletAddress),
        amount: charge.amount,
        network: network as "algorand:mainnet" | "algorand:testnet",
      });

      return c.json(success("Payment prepared", { charge, transactionId: String(transaction._id) }), 201);
    }

    const agent = await AgentModel.findById(agentId);
    if (!agent) {
      return c.json({ success: false, message: "Agent not found", data: {} }, 404);
    }

    const charge = buildChargeForAgent(agent as never);
    const transaction = await createTransaction({
      agentId,
      userId: (c.get("auth") as { userId: string }).userId,
      developerId: String(agent.ownerDeveloperId),
      walletAddress: String(walletAddress),
      amount: charge.amount,
      network: network as "algorand:mainnet" | "algorand:testnet",
    });

    return c.json(success("Payment prepared", { charge, transactionId: String(transaction._id) }), 201);
  });

  app.get("/transactions", authMiddleware, async c => {
    if (env.DEMO_MODE) {
      return c.json(success("Transactions loaded", demoTransactions));
    }

    const transactions = await TransactionModel.find().sort({ createdAt: -1 }).limit(100).lean();
    return c.json(success("Transactions loaded", transactions));
  });

  app.get("/receipts", authMiddleware, async c => {
    if (env.DEMO_MODE) {
      return c.json(success("Receipts loaded", demoReceipts));
    }

    const receipts = await ReceiptModel.find().sort({ createdAt: -1 }).limit(100).lean();
    return c.json(success("Receipts loaded", receipts));
  });

  app.get("/receipts/:id/download", authMiddleware, async c => {
    if (env.DEMO_MODE) {
      const receipt = demoReceipts.find(item => item._id === c.req.param("id")!);
      if (!receipt) {
        return c.json({ success: false, message: "Receipt not found", data: {} }, 404);
      }

      return c.json(success("Receipt download ready", { downloadUrl: receipt.downloadUrl }));
    }

    const receipt = await ReceiptModel.findById(c.req.param("id")!).lean();
    if (!receipt) {
      return c.json({ success: false, message: "Receipt not found", data: {} }, 404);
    }

    return c.json(success("Receipt download ready", { downloadUrl: receipt.downloadUrl }));
  });

  return app;
}
