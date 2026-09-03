import mongoose, { Schema, model, type Model } from "mongoose";

export interface CategoryDocument {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    icon: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CategoryModel = (mongoose.models.Category ?? model<CategoryDocument>("Category", categorySchema)) as Model<CategoryDocument>;
