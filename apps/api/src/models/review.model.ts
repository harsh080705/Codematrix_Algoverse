import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface ReviewDocument {
  agentId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 120 },
    comment: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true },
);

reviewSchema.index({ agentId: 1, userId: 1 }, { unique: true });

export const ReviewModel = (mongoose.models.Review ?? model<ReviewDocument>("Review", reviewSchema)) as Model<ReviewDocument>;
