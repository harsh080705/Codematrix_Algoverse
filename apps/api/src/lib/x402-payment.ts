type PaymentHeaderPayload = {
  transaction?: string;
  payer?: string;
  payload?: {
    transaction?: string;
    payer?: string;
  };
};

export function decodeBase64Json<T>(value: string | undefined | null): T | null {
  if (!value) return null;

  try {
    const json = Buffer.from(value, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function getPaymentTransactionIdFromRequest(headers: Headers): string | null {
  const headerValue = headers.get("PAYMENT-SIGNATURE") ?? headers.get("X-PAYMENT");
  const decoded = decodeBase64Json<PaymentHeaderPayload>(headerValue);

  return decoded?.payload?.transaction ?? decoded?.transaction ?? null;
}

export function getPaymentPayerFromRequest(headers: Headers): string | null {
  const headerValue = headers.get("PAYMENT-SIGNATURE") ?? headers.get("X-PAYMENT");
  const decoded = decodeBase64Json<PaymentHeaderPayload>(headerValue);

  return decoded?.payload?.payer ?? decoded?.payer ?? null;
}
