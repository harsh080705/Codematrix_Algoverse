import { ReceiptModel, TransactionModel } from "../models";

function receiptNumberFromId(id: string): string {
  return `RCP-${id.slice(-8).toUpperCase()}`;
}

export async function issueReceipt(transactionId: string, paymentTxId: string) {
  const transaction = await TransactionModel.findById(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const existingReceipt = await ReceiptModel.findOne({ transactionId });
  if (existingReceipt) {
    if (existingReceipt.paymentTxId !== paymentTxId || existingReceipt.status !== "issued") {
      existingReceipt.paymentTxId = paymentTxId;
      existingReceipt.status = "issued";
      existingReceipt.issuedAt = existingReceipt.issuedAt ?? new Date();
      await existingReceipt.save();
    }
    await TransactionModel.findByIdAndUpdate(transactionId, {
      receiptId: existingReceipt._id,
      status: "settled",
      txId: paymentTxId,
    });
    return existingReceipt;
  }

  const receipt = await ReceiptModel.create({
    transactionId,
    agentId: transaction.agentId,
    userId: transaction.userId,
    developerId: transaction.developerId,
    receiptNumber: receiptNumberFromId(String(transactionId)),
    amount: transaction.amount,
    marketplaceFee: transaction.marketplaceFee,
    developerEarnings: transaction.developerShare,
    paymentTxId,
    downloadUrl: `/api/receipts/${transactionId}/download`,
    status: "issued",
    issuedAt: new Date(),
  });

  await TransactionModel.findByIdAndUpdate(transactionId, { receiptId: receipt._id, status: "settled", txId: paymentTxId });

  return receipt;
}
