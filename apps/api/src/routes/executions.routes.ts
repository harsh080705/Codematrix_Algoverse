import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { failure, success } from "../lib/response";
import { ExecutionModel, ReceiptModel, TransactionModel } from "../models";
import { env } from "../config/env";
import { demoExecutions, demoReceipts, demoTransactions, getDemoExecutionById } from "../lib/demo-store";

export function createExecutionRoutes() {
  const app = new Hono();

  app.get("/executions/:executionId", authMiddleware, async c => {
    const executionId = c.req.param("executionId")!;

    if (env.DEMO_MODE) {
      const execution = getDemoExecutionById(executionId);
      if (!execution) {
        return c.json(failure("Execution not found"), 404);
      }
      return c.json(success("Execution loaded", execution));
    }

    const execution = await ExecutionModel.findOne({ executionId }).lean();
    if (!execution) {
      return c.json(failure("Execution not found"), 404);
    }

    return c.json(success("Execution loaded", execution));
  });

  app.get("/transactions/:transactionId", authMiddleware, async c => {
    const transactionId = c.req.param("transactionId")!;

    if (env.DEMO_MODE) {
      const transaction = demoTransactions.find(item => item._id === transactionId);
      if (!transaction) {
        return c.json(failure("Transaction not found"), 404);
      }
      return c.json(success("Transaction loaded", transaction));
    }

    const transaction = await TransactionModel.findById(transactionId).lean();
    if (!transaction) {
      return c.json(failure("Transaction not found"), 404);
    }

    return c.json(success("Transaction loaded", transaction));
  });

  app.get("/receipts/:executionId", authMiddleware, async c => {
    const executionId = c.req.param("executionId")!;

    if (env.DEMO_MODE) {
      const execution = getDemoExecutionById(executionId);
      if (!execution) {
        return c.json(failure("Receipt not found"), 404);
      }

      const transaction = demoTransactions.find(item => item._id === execution.transactionId);
      const receipt = transaction?.receiptId ? demoReceipts.find(item => item._id === transaction.receiptId) : null;
      if (!receipt) {
        return c.json(failure("Receipt not found"), 404);
      }
      return c.json(success("Receipt loaded", receipt));
    }

    const execution = await ExecutionModel.findOne({ executionId }).lean();
    if (!execution) {
      return c.json(failure("Receipt not found"), 404);
    }

    const transaction = await TransactionModel.findById(execution.transactionId).lean();
    if (!transaction?.receiptId) {
      return c.json(failure("Receipt not found"), 404);
    }

    const receipt = await ReceiptModel.findById(transaction.receiptId).lean();
    if (!receipt) {
      return c.json(failure("Receipt not found"), 404);
    }

    return c.json(success("Receipt loaded", receipt));
  });

  return app;
}
