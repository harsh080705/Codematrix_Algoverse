import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface AgentVersionRecord {
  agentId: Types.ObjectId;
  version: string;
  label: string;
  changelog: string;
  configSnapshot: Record<string, unknown>;
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const agentVersionSchema = new Schema<AgentVersionRecord>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    version: { type: String, required: true },
    label: { type: String, default: "" },
    changelog: { type: String, required: true },
    configSnapshot: { type: Schema.Types.Mixed, default: {} },
    active: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

agentVersionSchema.index({ agentId: 1, version: 1 }, { unique: true });

export const AgentVersionModel = (mongoose.models.AgentVersion ?? model<AgentVersionRecord>("AgentVersion", agentVersionSchema)) as Model<AgentVersionRecord>;
