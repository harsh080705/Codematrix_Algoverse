import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface AnalyticsDocument {
  scope: "platform" | "developer" | "agent";
  ownerId?: Types.ObjectId;
  date: string;
  revenue: number;
  runs: number;
  users: number;
  transactions: number;
  conversionRate: number;
  tokensUsed: number;
  avgResponseTimeMs: number;
  toolUsage: Record<string, number>;
  successCount: number;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<AnalyticsDocument>(
  {
    scope: { type: String, enum: ["platform", "developer", "agent"], required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, index: true },
    date: { type: String, required: true, index: true },
    revenue: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    users: { type: Number, default: 0 },
    transactions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    avgResponseTimeMs: { type: Number, default: 0 },
    toolUsage: { type: Schema.Types.Mixed, default: {} },
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

analyticsSchema.index({ scope: 1, ownerId: 1, date: 1 }, { unique: true });

export const AnalyticsModel = (mongoose.models.Analytics ?? model<AnalyticsDocument>("Analytics", analyticsSchema)) as Model<AnalyticsDocument>;
