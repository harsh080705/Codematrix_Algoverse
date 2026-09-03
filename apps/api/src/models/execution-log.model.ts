import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface ExecutionLogDocument {
  agentId: Types.ObjectId;
  userId?: Types.ObjectId;
  transactionId?: Types.ObjectId;
  status: "success" | "error";
  latencyMs: number;
  tokensUsed: number;
  toolsUsed: string[];
  provider: string;
  model: string;
  inputPreview?: string;
  outputPreview?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const executionLogSchema = new Schema<ExecutionLogDocument>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    status: { type: String, enum: ["success", "error"], default: "success", index: true },
    latencyMs: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    toolsUsed: { type: [String], default: [] },
    provider: { type: String, default: "" },
    model: { type: String, default: "" },
    inputPreview: { type: String },
    outputPreview: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

executionLogSchema.index({ agentId: 1, createdAt: -1 });
executionLogSchema.index({ createdAt: -1 });

export const ExecutionLogModel = (mongoose.models.ExecutionLog ?? model<ExecutionLogDocument>("ExecutionLog", executionLogSchema)) as Model<ExecutionLogDocument>;
