import { randomUUID } from "node:crypto";
import mongoose, { Schema, model, type Model, type Types } from "mongoose";
import type { ExecutionStatus } from "@aihub/shared";

export interface ExecutionDocument {
  executionId: string;
  userId: Types.ObjectId;
  agentId: Types.ObjectId;
  agentVersion?: string;
  transactionId: Types.ObjectId;
  paymentAmount: number;
  currency: "USDC";
  status: ExecutionStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  n8nExecutionId?: string;
  walletAddress?: string;
  paymentVerified: boolean;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const executionSchema = new Schema<ExecutionDocument>(
  {
    executionId: { type: String, default: () => `exec_${randomUUID().replace(/-/g, "")}`, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    agentVersion: { type: String, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true, unique: true, index: true },
    paymentAmount: { type: Number, required: true },
    currency: { type: String, default: "USDC" },
    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PAYMENT_REQUIRED",
        "PAYMENT_PROCESSING",
        "PAYMENT_VERIFIED",
        "EXECUTING",
        "COMPLETED",
        "FAILED",
        "REFUNDED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },
    input: { type: Schema.Types.Mixed, default: {} },
    output: { type: Schema.Types.Mixed },
    n8nExecutionId: { type: String, index: true },
    walletAddress: { type: String, index: true },
    paymentVerified: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    error: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

executionSchema.index({ agentId: 1, createdAt: -1 });
executionSchema.index({ userId: 1, createdAt: -1 });

export const ExecutionModel =
  (mongoose.models.Execution ?? model<ExecutionDocument>("Execution", executionSchema)) as Model<ExecutionDocument>;
