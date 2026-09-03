import mongoose, { Schema, model, type Model } from "mongoose";
import type { UserRole, WalletProvider } from "@aihub/shared";

export interface UserDocument {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  walletAddress?: string;
  walletProvider?: WalletProvider;
  isWalletVerified: boolean;
  emailVerified: boolean;
  refreshTokens: string[];
  status: "active" | "suspended" | "deleted";
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "developer", "admin"], default: "user", index: true },
    avatarUrl: { type: String },
    walletAddress: { type: String, unique: true, sparse: true, index: true },
    walletProvider: { type: String, enum: ["pera"] },
    isWalletVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    refreshTokens: { type: [String], default: [] },
    status: { type: String, enum: ["active", "suspended", "deleted"], default: "active" },
    lastLogin: { type: Date },
  },
  { timestamps: true },
);

export const UserModel = (mongoose.models.User ?? model<UserDocument>("User", userSchema)) as Model<UserDocument>;
