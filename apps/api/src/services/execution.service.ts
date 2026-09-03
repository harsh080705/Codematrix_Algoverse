import { ExecutionModel, ReceiptModel, TransactionModel } from "../models";
import { issueReceipt } from "./receipt.service";

export async function createExecution(input: {
  executionId?: string;
  userId: string;
  agentId: string;
  agentVersion?: string;
  transactionId: string;
  paymentAmount: number;
  currency: "USDC";
  input: Record<string, unknown>;
  walletAddress?: string;
  paymentVerified?: boolean;
  status?: "PENDING_PAYMENT" | "PAYMENT_REQUIRED" | "PAYMENT_PROCESSING" | "PAYMENT_VERIFIED" | "EXECUTING" | "COMPLETED" | "FAILED" | "REFUNDED";
  metadata?: Record<string, unknown>;
}) {
  const execution = await ExecutionModel.findOneAndUpdate(
    { transactionId: input.transactionId },
    {
      $setOnInsert: {
        executionId: input.executionId,
        userId: input.userId,
        agentId: input.agentId,
        agentVersion: input.agentVersion,
        transactionId: input.transactionId,
        paymentAmount: input.paymentAmount,
        currency: input.currency,
        input: input.input,
        walletAddress: input.walletAddress,
        paymentVerified: input.paymentVerified ?? false,
        status: input.status ?? "PENDING_PAYMENT",
        metadata: input.metadata ?? {},
        startedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return execution;
}

export async function updateExecution(
  executionId: string,
  patch: Partial<{
    status: "PENDING_PAYMENT" | "PAYMENT_REQUIRED" | "PAYMENT_PROCESSING" | "PAYMENT_VERIFIED" | "EXECUTING" | "COMPLETED" | "FAILED" | "REFUNDED";
    output: Record<string, unknown>;
    n8nExecutionId: string;
    paymentVerified: boolean;
    completedAt: Date;
    error: string;
    metadata: Record<string, unknown>;
  }>,
) {
  return ExecutionModel.findOneAndUpdate({ executionId }, { $set: patch }, { new: true });
}

export async function getExecutionByExecutionId(executionId: string) {
  return ExecutionModel.findOne({ executionId }).lean();
}

export async function getExecutionByTransactionId(transactionId: string) {
  return ExecutionModel.findOne({ transactionId }).lean();
}

export async function getReceiptByExecutionId(executionId: string) {
  const execution = await ExecutionModel.findOne({ executionId }).lean();
  if (!execution) {
    return null;
  }

  const transaction = await TransactionModel.findById(execution.transactionId).lean();
  if (!transaction?.receiptId) {
    return null;
  }

  return ReceiptModel.findById(transaction.receiptId).lean();
}

export async function ensureReceiptForExecution(executionId: string, paymentTxId: string) {
  const execution = await ExecutionModel.findOne({ executionId }).lean();
  if (!execution) {
    throw new Error("Execution not found");
  }

  const receipt = await issueReceipt(String(execution.transactionId), paymentTxId);
  return receipt;
}
