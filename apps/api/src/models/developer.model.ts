import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface DeveloperDocument {
  userId: Types.ObjectId;
  companyName?: string;
  bio?: string;
  websiteUrl?: string;
  portfolioUrl?: string;
  payoutAddress: string;
  approved: boolean;
  approvedAt?: Date;
  totalRevenue: number;
  totalUsage: number;
  averageRating: number;
  totalRatings: number;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const developerSchema = new Schema<DeveloperDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    companyName: { type: String, trim: true, maxlength: 120 },
    bio: { type: String, maxlength: 1000 },
    websiteUrl: { type: String },
    portfolioUrl: { type: String },
    payoutAddress: { type: String, required: true },
    approved: { type: Boolean, default: false, index: true },
    approvedAt: { type: Date },
    totalRevenue: { type: Number, default: 0 },
    totalUsage: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    categories: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const DeveloperModel = (mongoose.models.Developer ?? model<DeveloperDocument>("Developer", developerSchema)) as Model<DeveloperDocument>;
