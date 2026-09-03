import mongoose, { Schema, model, type Model, type Types } from "mongoose";
import type { MarketplaceNetwork, TransactionStatus } from "@aihub/shared";

export interface TransactionDocument {
  agentId: Types.ObjectId;
  userId: Types.ObjectId;
  developerId: Types.ObjectId;
  executionId?: string;
  receiptId?: Types.ObjectId;
  status: TransactionStatus;
  amount: number;
  marketplaceFee: number;
  developerShare: number;
  txId?: string;
  paymentPayload?: Record<string, unknown>;
  paymentRequirements?: Record<string, unknown>;
  walletAddress?: string;
  network: MarketplaceNetwork;
  paymentVerified?: boolean;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    developerId: { type: Schema.Types.ObjectId, ref: "Developer", required: true, index: true },
    executionId: { type: String, index: true },
    receiptId: { type: Schema.Types.ObjectId, ref: "Receipt" },
    status: {
      type: String,
      enum: ["initiated", "challenged", "verified", "settled", "failed"],
      default: "initiated",
      index: true,
    },
    amount: { type: Number, required: true },
    marketplaceFee: { type: Number, required: true },
    developerShare: { type: Number, required: true },
    txId: { type: String, index: true },
    paymentPayload: { type: Schema.Types.Mixed },
    paymentRequirements: { type: Schema.Types.Mixed },
    walletAddress: { type: String, index: true },
    network: { type: String, required: true },
    paymentVerified: { type: Boolean, default: false },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

export const TransactionModel = (mongoose.models.Transaction ?? model<TransactionDocument>("Transaction", transactionSchema)) as Model<TransactionDocument>;
