import { API_URL } from "./api";
import { getAccessToken, getStoredWalletAddress, setStoredWalletAddress } from "./session";
import { createPaidFetch } from "./x402";
import { connectPeraWallet, createPeraX402Signer, getPeraX402Network, restorePeraWalletSession } from "./pera";

function decodeBase64Json<T>(value: string): T | null {
  try {
    return JSON.parse(atob(value)) as T;
  } catch {
    return null;
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

export async function runPaidAgent(
  agentId: string,
  input: Record<string, unknown>,
  options?: { resumeFile?: File | null; skipPayment?: boolean },
) {
  const accessToken = getAccessToken();
  let walletAddress = getStoredWalletAddress();

  // On first Pay & Run (when skipPayment is false):
  // Prompt Pera Wallet connection modal if wallet is not connected yet!
  if (!options?.skipPayment && !walletAddress) {
    const restored = await restorePeraWalletSession().catch(() => "");
    walletAddress = restored || (await connectPeraWallet().catch(() => ""));
    if (walletAddress) {
      setStoredWalletAddress(walletAddress);
    }
  }

  if (!accessToken && !walletAddress) {
    throw new Error("Please connect Pera Wallet before running paid agents.");
  }

  const inputPayload: Record<string, unknown> = { ...input };
  if (options?.resumeFile) {
    inputPayload.resumeFile = {
      name: options.resumeFile.name,
      type: options.resumeFile.type || "application/octet-stream",
      size: options.resumeFile.size,
      lastModified: options.resumeFile.lastModified,
      data: await fileToBase64(options.resumeFile),
    };
  }

  const requestBody = JSON.stringify({ input: inputPayload });

  const runDirectly = async () =>
    fetch(`${API_URL}/agents/${agentId}/run`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-session-id": String(inputPayload.sessionId || "active-session-id"),
      },
      body: requestBody,
    });

  const runWithBrowserWallet = async () => {
    const paidFetch = createPaidFetch(createPeraX402Signer(walletAddress), getPeraX402Network());
    return paidFetch(`${API_URL}/agents/${agentId}/run`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });
  };

  const runWithBackendSigner = async () =>
    fetch(`${API_URL}/agents/${agentId}/run-autonomous`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

  let response: Response;
  try {
    // Session Active -> Skip Pera Wallet & Run Directly!
    if (options?.skipPayment) {
      try {
        response = await runDirectly();
      } catch {
        response = await runWithBackendSigner();
      }

      if (!response.ok && response.status === 402) {
        response = await runWithBackendSigner();
      }
    } else if (walletAddress) {
      // First Pay & Run -> Request Pera Wallet to sign x402 payment!
      response = await runWithBrowserWallet();
    } else {
      response = await runWithBackendSigner();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("failed to fetch")) {
      throw new Error("API server connection error. Please ensure the API backend (http://localhost:8080) is running.");
    }
    if (walletAddress && !options?.skipPayment) {
      throw new Error(`Pera Wallet payment failed: ${message}`);
    }

    throw error;
  }

  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: {
      execution?: Record<string, unknown>;
      transaction?: Record<string, unknown>;
      receipt?: Record<string, unknown> | null;
      output?: Record<string, unknown>;
      result?: Record<string, unknown>;
      latencyMs?: number;
      usage?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };
  } | null;

  if (!response.ok) {
    if (response.status === 402) {
      const paymentRequiredHeader = response.headers.get("PAYMENT-REQUIRED");
      const paymentRequired = paymentRequiredHeader ? decodeBase64Json<{ error?: string }>(paymentRequiredHeader) : null;
      const paymentReason = paymentRequired?.error ?? payload?.message ?? "";

      if (typeof paymentReason === "string" && paymentReason.length > 0) {
        if (paymentReason.includes("invalid_exact_avm_simulation_failed")) {
          throw new Error(
            "Pera Wallet payment failed: the wallet or receiving address may need USDC opt-in or more ALGO for fees on the selected network.",
          );
        }

        throw new Error(`Pera Wallet payment failed: ${paymentReason}`);
      }
    }

    if (
      typeof payload?.message === "string" &&
      payload.message.includes("AUTONOMOUS_PAYMENT_MNEMONIC is not configured")
    ) {
      throw new Error("Connect Pera Wallet on the Wallet page before running paid agents.");
    }
    throw new Error(payload?.message ?? `Agent run failed (${response.status})`);
  }

  return {
    output: payload?.data?.result ?? payload?.data?.output ?? {},
    latencyMs: payload?.data?.latencyMs ?? 0,
    execution: payload?.data?.execution ?? null,
    transaction: payload?.data?.transaction ?? null,
    receipt: payload?.data?.receipt ?? null,
    usage: payload?.data?.usage ?? {},
    metadata: payload?.data?.metadata ?? {},
    paymentResponse: response.headers.get("PAYMENT-RESPONSE") ?? "",
  };
}
