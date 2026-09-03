import mongoose, { Schema, model, type Model, type Types } from "mongoose";
import type { AgentStatus, AgentConfig } from "@aihub/shared";

export interface AgentVersionDocument {
  version: string;
  changelog: string;
  endpoint: string;
  active: boolean;
  createdAt: Date;
}

export interface AgentDocument {
  slug: string;
  name: string;
  category: string;
  description: string;
  documentation: string;
  endpoint: string;
  ownerDeveloperId: Types.ObjectId;
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
  status: AgentStatus;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  screenshots: string[];
  versions: AgentVersionDocument[];
  disabledReason?: string;
  config: AgentConfig;
  tokensUsed: number;
  avgResponseTimeMs: number;
  successRate: number;
  errorRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const versionSchema = new Schema<AgentVersionDocument>(
  {
    version: { type: String, required: true },
    changelog: { type: String, required: true },
    endpoint: { type: String, required: true },
    active: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const configSchema = new Schema<AgentConfig>(
  {
    ai: {
      provider: { type: String, default: "gemini" },
      model: { type: String, default: "" },
      temperature: { type: Number, default: 0.4 },
      maxTokens: { type: Number, default: 800 },
      systemPrompt: { type: String, default: "" },
      instructions: { type: String, default: "" },
      responseFormat: { type: String, default: "json" },
    },
    pricing: {
      currency: { type: String, default: "USDC" },
      pricePerRequest: { type: Number, default: 0.01 },
      freeTrial: { type: Boolean, default: false },
      freeTrialRequests: { type: Number },
      rateLimitPerMinute: { type: Number },
      rateLimitPerDay: { type: Number },
    },
    input: {
      text: { type: Boolean, default: true },
      pdf: { type: Boolean, default: false },
      image: { type: Boolean, default: false },
      audio: { type: Boolean, default: false },
      json: { type: Boolean, default: false },
    },
    output: {
      markdown: { type: Boolean, default: false },
      json: { type: Boolean, default: true },
      text: { type: Boolean, default: true },
      pdf: { type: Boolean, default: false },
      image: { type: Boolean, default: false },
    },
tools: { type: Schema.Types.Mixed, default: [] },
    icon: { type: String },
    banner: { type: String },
    n8nWorkflowId: { type: String },
    n8nWebhookUrl: { type: String },
  },
  { _id: false },
);

const agentSchema = new Schema<AgentDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    description: { type: String, required: true, maxlength: 500 },
    documentation: { type: String, required: true },
    endpoint: { type: String, required: true },
    ownerDeveloperId: { type: Schema.Types.ObjectId, ref: "Developer", required: true, index: true },
    tags: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USDC" },
    commissionRate: { type: Number, default: 0.1 },
    developerShare: { type: Number, default: 0.9 },
    marketplaceShare: { type: Number, default: 0.1 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "disabled"],
      default: "pending",
      index: true,
    },
    inputSchema: { type: Schema.Types.Mixed, default: {} },
    outputSchema: { type: Schema.Types.Mixed, default: {} },
    screenshots: { type: [String], default: [] },
    versions: { type: [versionSchema], default: [] },
    disabledReason: { type: String },
    config: { type: configSchema, default: () => ({}) },
    tokensUsed: { type: Number, default: 0 },
    avgResponseTimeMs: { type: Number, default: 0 },
    successRate: { type: Number, default: 100 },
    errorRate: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const AgentModel = (mongoose.models.Agent ?? model<AgentDocument>("Agent", agentSchema)) as Model<AgentDocument>;
