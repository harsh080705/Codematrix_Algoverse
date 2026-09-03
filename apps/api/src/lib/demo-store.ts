import { randomBytes } from "node:crypto";
import { SAMPLE_AGENTS, COMMISSION_RATE, DEVELOPER_REVENUE_SHARE, MARKETPLACE_REVENUE_SHARE } from "@aihub/shared";
import { executeSampleAgent } from "./sample-agents";

export interface DemoUserRecord {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: "user" | "developer" | "admin";
  walletAddress?: string;
  walletProvider?: "pera";
  isWalletVerified: boolean;
}

export interface DemoAgentRecord {
  _id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  documentation: string;
  endpoint: string;
  ownerDeveloperId: string;
  tags: string[];
  price: number;
  currency: "USDC";
  commissionRate: number;
  developerShare: number;
  marketplaceShare: number;
  averageRating: number;
  reviewCount: number;
  totalRuns: number;
  favoritesCount: number;
  featured: boolean;
  trending: boolean;
  status: "draft" | "pending" | "approved" | "disabled";
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  screenshots: string[];
  versions: Array<{ version: string; changelog: string; endpoint: string; active: boolean; createdAt: string }>;
  config?: Record<string, unknown>;
  disabledReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoTransactionRecord {
  _id: string;
  agentId: string;
  userId: string;
  developerId: string;
  executionId?: string;
  receiptId?: string;
  status: "initiated" | "challenged" | "verified" | "settled" | "failed";
  amount: number;
  marketplaceFee: number;
  developerShare: number;
  txId?: string;
  paymentPayload?: Record<string, unknown>;
  paymentRequirements?: Record<string, unknown>;
  walletAddress?: string;
  network: "algorand:mainnet" | "algorand:testnet";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoExecutionRecord {
  executionId: string;
  userId: string;
  agentId: string;
  agentVersion?: string;
  transactionId: string;
  paymentAmount: number;
  currency: "USDC";
  status:
    | "PENDING_PAYMENT"
    | "PAYMENT_REQUIRED"
    | "PAYMENT_PROCESSING"
    | "PAYMENT_VERIFIED"
    | "EXECUTING"
    | "COMPLETED"
    | "FAILED"
    | "REFUNDED";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  n8nExecutionId?: string;
  walletAddress?: string;
  paymentVerified: boolean;
  startedAt: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DemoReceiptRecord {
  _id: string;
  transactionId: string;
  agentId: string;
  userId: string;
  developerId: string;
  receiptNumber: string;
  amount: number;
  marketplaceFee: number;
  developerEarnings: number;
  paymentTxId: string;
  downloadUrl: string;
  status: "pending" | "issued" | "downloaded";
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
}

function newId(): string {
  return randomBytes(12).toString("hex");
}

const now = () => new Date().toISOString();

export const demoUsers: DemoUserRecord[] = [
  {
    id: "000000000000000000000001",
    fullName: "Demo Developer",
    email: "developer@aihub.market",
    password: "ChangeMe123!",
    role: "developer",
    walletAddress: "",
    walletProvider: "pera",
    isWalletVerified: false,
  },
  {
    id: "000000000000000000000002",
    fullName: "AIHub Admin",
    email: "admin@aihub.market",
    password: "ChangeMe123!",
    role: "admin",
    walletAddress: "",
    walletProvider: "pera",
    isWalletVerified: false,
  },
];

export const demoDeveloperId = "00000000000000000000a001";

export const demoAgents: DemoAgentRecord[] = SAMPLE_AGENTS.map((agent, index) => ({
  _id: `${index.toString(16).padStart(24, "0")}`,
  slug: agent.slug,
  name: agent.name,
  category: agent.category,
  description: agent.description,
  documentation: `# ${agent.name}\n\n${agent.description}\n\n## Pricing\n\n$${agent.price.toFixed(2)} USDC per invocation.`,
  endpoint: `https://demo.aihub.local/agents/${index.toString(16).padStart(24, "0")}/run`,
  ownerDeveloperId: demoDeveloperId,
  tags: [agent.category, "x402", "algorand"],
  price: agent.price,
  currency: "USDC",
  commissionRate: COMMISSION_RATE,
  developerShare: DEVELOPER_REVENUE_SHARE,
  marketplaceShare: MARKETPLACE_REVENUE_SHARE,
  averageRating: 4.7,
  reviewCount: 0,
  totalRuns: 0,
  favoritesCount: 0,
  featured: index < 4,
  trending: index < 6,
  status: "approved",
inputSchema: {},
  outputSchema: {},
  screenshots: [],
  config: {
    ai: {
      provider: "gemini",
      model: "gemini-1.5-flash",
      temperature: 0.4,
      maxTokens: 800,
      systemPrompt: agent.description,
      instructions: "",
      responseFormat: "json",
    },
    pricing: {
      currency: "USDC",
      pricePerRequest: agent.price,
      freeTrial: false,
    },
    input: { text: true, pdf: false, image: false, audio: false, json: false },
    output: { markdown: false, json: true, text: true, pdf: false, image: false },
    tools: [],
    n8nWebhookUrl: agent.slug === "text-summarizer" ? "https://sudeshmuk.app.n8n.cloud/webhook/warimitra-text-summarizer" : undefined,
  },
  versions: [{ version: "1.0.0", changelog: "Initial release", endpoint: `https://demo.aihub.local/agents/${index.toString(16).padStart(24, "0")}/run`, active: true, createdAt: now() }],
  createdAt: now(),
  updatedAt: now(),
}));

export const demoTransactions: DemoTransactionRecord[] = [];
export const demoReceipts: DemoReceiptRecord[] = [];
export const demoExecutions: DemoExecutionRecord[] = [];

export function getDemoUserByEmail(email: string) {
  return demoUsers.find(user => user.email === email);
}

export function getDemoUserById(id: string) {
  return demoUsers.find(user => user.id === id);
}

export function updateDemoUserWallet(userId: string, walletAddress: string) {
  const user = demoUsers.find(item => item.id === userId);
  if (!user) {
    return null;
  }

  user.walletAddress = walletAddress;
  user.walletProvider = "pera";
  user.isWalletVerified = true;
  return user;
}

export function listDemoAgents() {
  return demoAgents;
}

export function getDemoAgentById(id: string) {
  return demoAgents.find(agent => agent._id === id) ?? null;
}

export function listDemoTransactions() {
  return [...demoTransactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listDemoReceipts() {
  return [...demoReceipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createDemoTransaction(input: {
  agentId: string;
  userId: string;
  developerId: string;
  walletAddress: string;
  amount: number;
  network: "algorand:mainnet" | "algorand:testnet";
  paymentPayload?: Record<string, unknown>;
  paymentRequirements?: Record<string, unknown>;
}) {
  const marketplaceFee = Number((input.amount * 0.1).toFixed(6));
  const developerShare = Number((input.amount - marketplaceFee).toFixed(6));
  const transaction: DemoTransactionRecord = {
    _id: newId(),
    ...input,
    status: "initiated",
    marketplaceFee,
    developerShare,
    createdAt: now(),
    updatedAt: now(),
  };

  demoTransactions.unshift(transaction);
  return transaction;
}

export function settleDemoTransaction(transactionId: string, paymentTxId: string) {
  const transaction = demoTransactions.find(item => item._id === transactionId);
  if (!transaction) {
    return null;
  }

  transaction.status = "settled";
  transaction.txId = paymentTxId;
  transaction.updatedAt = now();

  const receipt: DemoReceiptRecord = {
    _id: newId(),
    transactionId,
    agentId: transaction.agentId,
    userId: transaction.userId,
    developerId: transaction.developerId,
    receiptNumber: `RCP-${transactionId.slice(-8).toUpperCase()}`,
    amount: transaction.amount,
    marketplaceFee: transaction.marketplaceFee,
    developerEarnings: transaction.developerShare,
    paymentTxId,
    downloadUrl: `/api/receipts/${transactionId}/download`,
    status: "issued",
    issuedAt: now(),
    createdAt: now(),
    updatedAt: now(),
  };

  transaction.receiptId = receipt._id;
  demoReceipts.unshift(receipt);
  return { transaction, receipt };
}

export function createDemoExecution(input: {
  executionId: string;
  userId: string;
  agentId: string;
  agentVersion?: string;
  transactionId: string;
  paymentAmount: number;
  currency: "USDC";
  input: Record<string, unknown>;
  walletAddress?: string;
  paymentVerified?: boolean;
  status?: DemoExecutionRecord["status"];
  metadata?: Record<string, unknown>;
}) {
  const execution: DemoExecutionRecord = {
    executionId: input.executionId,
    userId: input.userId,
    agentId: input.agentId,
    agentVersion: input.agentVersion,
    transactionId: input.transactionId,
    paymentAmount: input.paymentAmount,
    currency: input.currency,
    status: input.status ?? "PENDING_PAYMENT",
    input: input.input,
    walletAddress: input.walletAddress,
    paymentVerified: input.paymentVerified ?? false,
    startedAt: now(),
    metadata: input.metadata ?? {},
    createdAt: now(),
    updatedAt: now(),
  };

  demoExecutions.unshift(execution);
  return execution;
}

export function updateDemoExecution(
  executionId: string,
  patch: Partial<Pick<DemoExecutionRecord, "status" | "output" | "n8nExecutionId" | "paymentVerified" | "completedAt" | "error" | "metadata">>,
) {
  const execution = demoExecutions.find(item => item.executionId === executionId);
  if (!execution) {
    return null;
  }

  Object.assign(execution, patch, { updatedAt: now() });
  return execution;
}

export function getDemoExecutionById(executionId: string) {
  return demoExecutions.find(execution => execution.executionId === executionId) ?? null;
}

export async function runDemoAgent(agentId: string, input: Record<string, unknown>) {
  const agent = getDemoAgentById(agentId);
  if (!agent || agent.status !== "approved") {
    throw new Error("Agent is not available");
  }

  const output = await executeSampleAgent(agent.slug, input);
  agent.totalRuns += 1;
  agent.updatedAt = now();
  return { agent, output, latencyMs: 1 };
}
