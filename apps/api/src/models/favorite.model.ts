import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface FavoriteDocument {
  userId: Types.ObjectId;
  agentId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ userId: 1, agentId: 1 }, { unique: true });

export const FavoriteModel = (mongoose.models.Favorite ?? model<FavoriteDocument>("Favorite", favoriteSchema)) as Model<FavoriteDocument>;
