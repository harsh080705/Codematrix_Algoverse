export type UserRole = "user" | "developer" | "admin";
export type AgentStatus = "draft" | "pending" | "approved" | "disabled";
export type TransactionStatus = "initiated" | "challenged" | "verified" | "settled" | "failed";
export type ReceiptStatus = "pending" | "issued" | "downloaded";
export type ExecutionStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_REQUIRED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_VERIFIED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";
export type WalletProvider = "pera";
export type PaymentScheme = "exact";
export type MarketplaceNetwork = "algorand:mainnet" | "algorand:testnet";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  avatarUrl?: string;
  walletAddress?: string;
  walletProvider?: WalletProvider;
  isWalletVerified: boolean;
  status?: string;
  emailVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperProfile extends UserProfile {
  companyName?: string;
  bio?: string;
  approved: boolean;
  payoutAddress: string;
  totalRevenue: number;
  totalUsage: number;
}

export interface AgentAiConfig {
  provider: (typeof import("./constants").AI_PROVIDERS)[number];
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  instructions: string;
  responseFormat: (typeof import("./constants").RESPONSE_FORMATS)[number];
}

export interface TimeWindowPricing {
  "45s"?: number;
  "5"?: number;
  "15"?: number;
  "30"?: number;
  "60"?: number;
}

export interface AgentPricingConfig {
  currency: "USDC";
  pricePerRequest: number;
  timeWindowPricing?: TimeWindowPricing;
  freeTrial: boolean;
  freeTrialRequests?: number;
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
}

export interface AgentInputConfig {
  text: boolean;
  pdf: boolean;
  image: boolean;
  audio: boolean;
  json: boolean;
}

export interface AgentOutputConfig {
  markdown: boolean;
  json: boolean;
  text: boolean;
  pdf: boolean;
  image: boolean;
}

export interface AgentToolConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface AgentConfig {
  ai: AgentAiConfig;
  pricing: AgentPricingConfig;
  input: AgentInputConfig;
  output: AgentOutputConfig;
  tools: AgentToolConfig[];
  icon?: string;
  banner?: string;
  n8nWorkflowId?: string;
  n8nWebhookUrl?: string;
}

export interface AgentPricing {
  currency: "USDC";
  amount: number;
  commissionRate: number;
  developerShare: number;
  marketplaceShare: number;
}

export interface AgentVersion {
  version: string;
  changelog: string;
  endpoint: string;
  active: boolean;
  createdAt: string;
}

export interface AgentSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  averageRating: number;
  reviewCount: number;
  totalRuns: number;
  pricing: AgentPricing;
  ownerName: string;
  ownerId: string;
  status: AgentStatus;
  featured: boolean;
  trending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDetail extends AgentSummary {
  documentation: string;
  endpoint: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  versions: AgentVersion[];
  screenshots: string[];
  favoritesCount: number;
}

export interface TransactionRecord {
  id: string;
  agentId: string;
  userId: string;
  developerId: string;
  executionId?: string;
  status: TransactionStatus;
  amount: number;
  txId?: string;
  receiptId?: string;
  walletAddress?: string;
  network: MarketplaceNetwork;
  paymentVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionRecord {
  executionId: string;
  userId: string;
  agentId: string;
  agentVersion?: string;
  transactionId: string;
  paymentAmount: number;
  currency: "USDC";
  status: ExecutionStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  n8nExecutionId?: string;
  walletAddress?: string;
  paymentVerified: boolean;
  startedAt: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ReceiptRecord {
  id: string;
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
  status: ReceiptStatus;
  issuedAt: string;
}

export interface RatingSummary {
  agentId: string;
  average: number;
  total: number;
  distribution: Record<string, number>;
}

export interface ReviewRecord {
  id: string;
  agentId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  agentId: string;
  createdAt: string;
}

export interface UsageLogRecord {
  id: string;
  agentId: string;
  userId?: string;
  latencyMs: number;
  statusCode: number;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  totalRevenue: number;
  totalTransactions: number;
  totalUsers: number;
  totalDevelopers: number;
  totalAgents: number;
  approvalRate: number;
  topAgents: AgentSummary[];
  topDevelopers: DeveloperProfile[];
  recentTransactions: TransactionRecord[];
  usageByDay: Array<{ date: string; runs: number; revenue: number }>;
}

export interface DashboardStats {
  revenue: number;
  txCount: number;
  activeUsers: number;
  topCategories: Array<{ category: string; count: number }>;
  pendingApprovals: number;
  disabledAgents: number;
}

export interface X402Challenge {
  x402Version: number;
  resource: string;
  accepts: Array<{
    scheme: PaymentScheme;
    network: MarketplaceNetwork;
    asset: string;
    amount: string;
    payTo: string;
    maxTimeoutSeconds?: number;
    extra?: Record<string, unknown>;
  }>;
  description: string;
}

export interface N8nAgentExecutionPayload {
  executionId: string;
  agentId: string;
  agentVersion?: string;
  userId: string;
  walletAddress: string;
  transactionId: string;
  paymentVerified: true;
  amount: string;
  currency: "USDC";
  input: Record<string, unknown>;
  agentConfig: {
    name: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    tools: AgentToolConfig[];
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    n8nWorkflowId?: string;
  };
}

export interface N8nAgentExecutionSuccess {
  success: true;
  executionId: string;
  agentId: string;
  result: Record<string, unknown>;
  usage?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface N8nAgentExecutionFailure {
  success: false;
  executionId: string;
  error: {
    code: string;
    message: string;
  };
}

export type N8nAgentExecutionResponse = N8nAgentExecutionSuccess | N8nAgentExecutionFailure;
