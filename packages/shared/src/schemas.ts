import { z } from "zod";
import {
  AGENT_CATEGORIES,
  AGENT_STATUSES,
  AGENT_TOOLS,
  AI_PROVIDERS,
  INPUT_TYPES,
  OUTPUT_TYPES,
  RESPONSE_FORMATS,
  USER_ROLES,
} from "./constants";

const categoryValues = AGENT_CATEGORIES as unknown as [string, ...string[]];
const roleValues = USER_ROLES as unknown as [string, ...string[]];
const agentStatusValues = AGENT_STATUSES as unknown as [string, ...string[]];
const aiProviderValues = AI_PROVIDERS as unknown as [string, ...string[]];
const responseFormatValues = RESPONSE_FORMATS as unknown as [string, ...string[]];
const inputTypeValues = INPUT_TYPES as unknown as [string, ...string[]];
const outputTypeValues = OUTPUT_TYPES as unknown as [string, ...string[]];
const toolValues = AGENT_TOOLS as unknown as [string, ...string[]];

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid identifier");
export const algorandAddressSchema = z.string().min(54).max(64);
export const currencyAmountSchema = z.number().positive().finite();

export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128).optional(),
  role: z.preprocess(
    val => (typeof val === "string" ? val.toLowerCase() : val),
    z.enum(roleValues).default("user"),
  ),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const connectWalletSchema = z.object({
  walletAddress: algorandAddressSchema,
  provider: z.literal("pera").default("pera"),
});

export const agentVersionSchema = z.object({
  version: z.string().min(1).max(32),
  changelog: z.string().min(1).max(2000),
  endpoint: z.string().url(),
  active: z.boolean().default(false),
});

export const agentCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
  category: z.enum(categoryValues),
  description: z.string().min(20).max(500),
  documentation: z.string().min(50).max(12000),
  endpoint: z.string().url(),
  tags: z.array(z.string().min(1).max(40)).default([]),
  price: currencyAmountSchema,
  currency: z.literal("USDC").default("USDC"),
  inputSchema: z.record(z.string(), z.any()).default({}),
  outputSchema: z.record(z.string(), z.any()).default({}),
  screenshots: z.array(z.string().url()).default([]),
  featured: z.boolean().default(false),
  versions: z.array(agentVersionSchema).default([]),
});

export const agentUpdateSchema = agentCreateSchema.partial().extend({
  status: z.enum(agentStatusValues).optional(),
  disabledReason: z.string().max(500).optional(),
});

export const runAgentSchema = z.object({
  input: z.record(z.string(), z.any()).default({}),
  notes: z.string().max(1000).optional(),
});

export const paymentSchema = z.object({
  agentId: objectIdSchema,
  userId: objectIdSchema,
  amount: currencyAmountSchema,
  network: z.union([z.literal("algorand:mainnet"), z.literal("algorand:testnet")]),
  walletAddress: algorandAddressSchema,
});

export const reviewSchema = z.object({
  agentId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(120),
  comment: z.string().min(5).max(1000),
});

export const categorySchema = z.object({
  name: z.enum(categoryValues),
  description: z.string().min(5).max(200),
  icon: z.string().max(120).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  category: z.enum(categoryValues).optional(),
  status: z.enum(agentStatusValues).optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["trending", "top-rated", "newest", "lowest-price", "highest-price", "most-used"]).default("trending"),
});

// ---------------------------------------------------------------------------
// Agent Builder schemas
// ---------------------------------------------------------------------------

export const agentAiConfigSchema = z.object({
  provider: z.enum(aiProviderValues).default("gemini"),
  model: z.string().min(1).max(120),
  temperature: z.number().min(0).max(2).default(0.4),
  maxTokens: z.number().int().min(1).max(32000).default(800),
  systemPrompt: z.string().min(1).max(12000),
  instructions: z.string().max(12000).default(""),
  responseFormat: z.enum(responseFormatValues).default("json"),
});

export const timeWindowPricingSchema = z.object({
  "45s": z.number().nonnegative().optional(),
  "5": z.number().nonnegative().optional(),
  "15": z.number().nonnegative().optional(),
  "30": z.number().nonnegative().optional(),
  "60": z.number().nonnegative().optional(),
}).optional();

export const agentPricingConfigSchema = z.object({
  currency: z.literal("USDC").default("USDC"),
  pricePerRequest: currencyAmountSchema,
  timeWindowPricing: timeWindowPricingSchema,
  freeTrial: z.boolean().default(false),
  freeTrialRequests: z.number().int().min(0).max(1000).optional(),
  rateLimitPerMinute: z.number().int().min(0).max(10000).optional(),
  rateLimitPerDay: z.number().int().min(0).max(100000).optional(),
});

export const agentInputConfigSchema = z.object({
  text: z.boolean().default(true),
  pdf: z.boolean().default(false),
  image: z.boolean().default(false),
  audio: z.boolean().default(false),
  json: z.boolean().default(false),
});

export const agentOutputConfigSchema = z.object({
  markdown: z.boolean().default(false),
  json: z.boolean().default(true),
  text: z.boolean().default(true),
  pdf: z.boolean().default(false),
  image: z.boolean().default(false),
});

export const agentToolConfigSchema = z.object({
  name: z.enum(toolValues),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.any()).optional(),
});

export const agentConfigSchema = z.object({
  ai: agentAiConfigSchema,
  pricing: agentPricingConfigSchema,
  input: agentInputConfigSchema,
  output: agentOutputConfigSchema,
  tools: z.array(agentToolConfigSchema).default([]),
  icon: z.string().max(500).optional(),
  banner: z.string().max(500).optional(),
  n8nWorkflowId: z.string().max(120).optional(),
  n8nWebhookUrl: z.string().max(500).optional(),
});

export const agentBuilderCreateSchema = z.object({
  name: z.string().min(2, "Agent name must be at least 2 characters").max(120),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(120).optional(),
  category: z.enum(categoryValues),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  tags: z.array(z.string().min(1).max(40)).default([]),
  config: agentConfigSchema,
});

export const agentBuilderUpdateSchema = agentBuilderCreateSchema.partial();

export const publishAgentSchema = z.object({
  price: currencyAmountSchema.optional(),
});

export const cloneAgentSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(120).optional(),
});

export const versionAgentSchema = z.object({
  changelog: z.string().min(1).max(2000),
  label: z.string().min(1).max(32).optional(),
});
