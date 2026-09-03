import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface RatingDocument {
  agentId: Types.ObjectId;
  average: number;
  total: number;
  distribution: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<RatingDocument>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, unique: true, index: true },
    average: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    distribution: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const RatingModel = (mongoose.models.Rating ?? model<RatingDocument>("Rating", ratingSchema)) as Model<RatingDocument>;
