import algosdk from "algosdk";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import type { ClientAvmSigner } from "@x402/avm";
import { env } from "../config/env";

class MnemonicAvmSigner implements ClientAvmSigner {
  address: string;
  #secretKey: Uint8Array;

  constructor(mnemonic: string) {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    this.address = account.addr.toString();
    this.#secretKey = account.sk;
  }

  async signTransactions(txns: Uint8Array[], indexesToSign?: number[]): Promise<(Uint8Array | null)[]> {
    const indicesToSign = indexesToSign ?? txns.map((_, index) => index);

    return txns.map((txn, index) => {
      if (!indicesToSign.includes(index)) {
        return null;
      }

      const decodedTxn = algosdk.decodeUnsignedTransaction(txn);
      return algosdk.signTransaction(decodedTxn, this.#secretKey).blob;
    });
  }
}

let autonomousHttpClient: x402HTTPClient | null = null;

function getAutonomousHttpClient(): x402HTTPClient {
  if (autonomousHttpClient) {
    return autonomousHttpClient;
  }

  if (!env.AUTONOMOUS_PAYMENT_MNEMONIC) {
    throw new Error("AUTONOMOUS_PAYMENT_MNEMONIC is not configured");
  }

  const signer = new MnemonicAvmSigner(env.AUTONOMOUS_PAYMENT_MNEMONIC);
  const client = new x402Client();
  client.register(env.X402_NETWORK as `${string}:${string}`, new ExactAvmScheme(signer));

  autonomousHttpClient = new x402HTTPClient(client);
  return autonomousHttpClient;
}

export async function fetchAutonomousPaidJson(
  resourceUrl: string,
  accessToken: string,
  input: Record<string, unknown>,
) {
  const headers = new Headers({
    authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  });
  const requestBody = JSON.stringify({ input });

  let response = await fetch(resourceUrl, {
    method: "POST",
    headers,
    body: requestBody,
  });

  if (response.status !== 402) {
    return {
      response,
      paymentResponse: response.headers.get("PAYMENT-RESPONSE") ?? "",
    };
  }

  const httpClient = getAutonomousHttpClient();
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    name => response.headers.get(name),
    await response.json().catch(() => null),
  );
  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  const paidHeaders = new Headers(headers);
  for (const [key, value] of Object.entries(paymentHeaders)) {
    paidHeaders.set(key, value);
  }

  response = await fetch(resourceUrl, {
    method: "POST",
    headers: paidHeaders,
    body: requestBody,
  });

  return {
    response,
    paymentResponse: response.headers.get("PAYMENT-RESPONSE") ?? "",
  };
}
