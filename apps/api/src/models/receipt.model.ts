import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export interface ReceiptDocument {
  transactionId: Types.ObjectId;
  agentId: Types.ObjectId;
  userId: Types.ObjectId;
  developerId: Types.ObjectId;
  receiptNumber: string;
  amount: number;
  marketplaceFee: number;
  developerEarnings: number;
  paymentTxId: string;
  downloadUrl: string;
  status: "pending" | "issued" | "downloaded";
  issuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<ReceiptDocument>(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    developerId: { type: Schema.Types.ObjectId, ref: "Developer", required: true, index: true },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    marketplaceFee: { type: Number, required: true },
    developerEarnings: { type: Number, required: true },
    paymentTxId: { type: String, required: true, index: true },
    downloadUrl: { type: String, required: true },
    status: { type: String, enum: ["pending", "issued", "downloaded"], default: "issued" },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const ReceiptModel = (mongoose.models.Receipt ?? model<ReceiptDocument>("Receipt", receiptSchema)) as Model<ReceiptDocument>;
