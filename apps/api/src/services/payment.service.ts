import { AgentModel, DeveloperModel, TransactionModel } from "../models";
import { issueReceipt } from "./receipt.service";
import { env } from "../config/env";
import { createDemoTransaction, getDemoAgentById, listDemoReceipts, listDemoTransactions, settleDemoTransaction } from "../lib/demo-store";

export function buildChargeForAgent(agent: { _id: string; price: number; ownerDeveloperId: string; currency?: string }) {
  const amount = agent.price;
  const marketplaceFee = Number((amount * 0.1).toFixed(6));
  const developerShare = Number((amount - marketplaceFee).toFixed(6));

  return {
    accepts: [
      {
        scheme: "exact" as const,
        network: env.X402_NETWORK,
        asset: env.X402_ASSET,
        amount: amount.toFixed(2),
        payTo: env.X402_PAY_TO,
        maxTimeoutSeconds: 60,
        extra: { agentId: String(agent._id), payoutAddress: agent.ownerDeveloperId },
      },
    ],
    amount,
    marketplaceFee,
    developerShare,
  };
}

export async function createTransaction(input: {
  agentId: string;
  userId: string;
  developerId: string;
  walletAddress: string;
  amount: number;
  network: "algorand:mainnet" | "algorand:testnet";
  paymentPayload?: Record<string, unknown>;
  paymentRequirements?: Record<string, unknown>;
}) {
  if (env.DEMO_MODE) {
    return createDemoTransaction(input) as never;
  }

  const marketplaceFee = Number((input.amount * 0.1).toFixed(6));
  const developerShare = Number((input.amount - marketplaceFee).toFixed(6));

  return TransactionModel.create({
    ...input,
    status: "initiated",
    marketplaceFee,
    developerShare,
  });
}

export async function settleTransaction(transactionId: string, paymentTxId: string) {
  if (env.DEMO_MODE) {
    return settleDemoTransaction(transactionId, paymentTxId)?.receipt ?? null;
  }

  const receipt = await issueReceipt(transactionId, paymentTxId);
  const transaction = await TransactionModel.findById(transactionId).lean();

  if (transaction) {
    await DeveloperModel.findByIdAndUpdate(transaction.developerId, {
      $inc: { totalRevenue: transaction.developerShare, totalUsage: 1 },
    });
    await AgentModel.findByIdAndUpdate(transaction.agentId, { $inc: { totalRuns: 1 } });
  }

  return receipt;
}
