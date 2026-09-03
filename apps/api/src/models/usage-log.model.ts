import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface UsageLogDocument {
  agentId: Types.ObjectId;
  userId?: Types.ObjectId;
  transactionId?: Types.ObjectId;
  latencyMs: number;
  statusCode: number;
  requestPath: string;
  requestMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const usageLogSchema = new Schema<UsageLogDocument>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    latencyMs: { type: Number, required: true },
    statusCode: { type: Number, required: true },
    requestPath: { type: String, required: true },
    requestMethod: { type: String, required: true },
  },
  { timestamps: true },
);

export const UsageLogModel = (mongoose.models.UsageLog ?? model<UsageLogDocument>("UsageLog", usageLogSchema)) as Model<UsageLogDocument>;
