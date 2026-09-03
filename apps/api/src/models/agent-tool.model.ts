import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface AgentToolDocument {
  agentId: Types.ObjectId;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const agentToolSchema = new Schema<AgentToolDocument>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

agentToolSchema.index({ agentId: 1, name: 1 }, { unique: true });

export const AgentToolModel = (mongoose.models.AgentTool ?? model<AgentToolDocument>("AgentTool", agentToolSchema)) as Model<AgentToolDocument>;
