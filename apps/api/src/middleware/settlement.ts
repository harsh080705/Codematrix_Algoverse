import type { Context, Next } from "hono";
import { TransactionModel } from "../models";
import { settleTransaction } from "../services";

interface PaymentDraft {
  agentId: string;
  userId: string;
  developerId: string;
  amount: number;
  network: "algorand:mainnet" | "algorand:testnet";
  walletAddress: string;
}

function decodePaymentResponse(header: string): { transaction?: string } | null {
  try {
    const json = Buffer.from(header, "base64").toString("utf8");
    return JSON.parse(json) as { transaction?: string };
  } catch {
    return null;
  }
}

export async function settlementMiddleware(c: Context, next: Next): Promise<Response | void> {
  await next();

  const paymentDraft = c.get("paymentDraft") as PaymentDraft | undefined;
  const transactionId = c.get("transactionId") as string | undefined;
  if (!paymentDraft || !transactionId) {
    return;
  }

  const response = c.res;
  if (!response) {
    return;
  }

  if (response.status >= 400) {
    try {
      await TransactionModel.findByIdAndUpdate(transactionId, {
        status: "failed",
        errorMessage: `Handler returned ${response.status}`,
      });
    } catch {
      // Demo mode has no MongoDB; ignore so we do not mask the original response.
    }
    return;
  }

  const paymentResponseHeader = response.headers.get("PAYMENT-RESPONSE");
  if (!paymentResponseHeader) {
    return;
  }

  const settlePayload = decodePaymentResponse(paymentResponseHeader);
  const paymentTxId = settlePayload?.transaction ?? `tx-${transactionId}`;
  await settleTransaction(transactionId, paymentTxId);
}
