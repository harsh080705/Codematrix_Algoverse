import { PeraWalletConnect } from "@perawallet/connect";
import type { ClientAvmSigner } from "@x402/avm";
import algosdk from "algosdk";
import type { SignerTransaction } from "@perawallet/connect";
import {
  clearWalletSession,
  getStoredPeraNetwork,
  getStoredWalletAddress,
  setStoredPeraNetwork,
  setStoredWalletAddress,
} from "./session";

// Testnet chain id for Pera Wallet. Use 416001 for mainnet.
const PERA_TESTNET_CHAIN_ID = 416002;
const PERA_MAINNET_CHAIN_ID = 416001;
const X402_ALGORAND_MAINNET = "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";
const X402_ALGORAND_TESTNET = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";

const peraWallet = new PeraWalletConnect({
  chainId: PERA_TESTNET_CHAIN_ID,
  compactMode: typeof window !== "undefined" ? window.innerWidth < 640 : false,
});

setPeraNetwork(getStoredPeraNetwork());

export function getPeraNetwork(): "testnet" | "mainnet" {
  return peraWallet.chainId === PERA_MAINNET_CHAIN_ID ? "mainnet" : "testnet";
}

export function getPeraX402Network(): typeof X402_ALGORAND_MAINNET | typeof X402_ALGORAND_TESTNET {
  return getPeraNetwork() === "mainnet" ? X402_ALGORAND_MAINNET : X402_ALGORAND_TESTNET;
}

export function setPeraNetwork(network: "testnet" | "mainnet"): void {
  const chainId = network === "mainnet" ? PERA_MAINNET_CHAIN_ID : PERA_TESTNET_CHAIN_ID;
  peraWallet.chainId = chainId;
  setStoredPeraNetwork(network);
}

export async function restorePeraWalletSession(): Promise<string> {
  try {
    const accounts = await peraWallet.reconnectSession();
    const address = accounts[0] ?? "";
    if (address) {
      setStoredWalletAddress(address);
      setStoredPeraNetwork(getPeraNetwork());
    }
    return address;
  } catch {
    return "";
  }
}

export async function connectPeraWallet(): Promise<string> {
  const accounts = await peraWallet.connect();
  const address = accounts[0] ?? "";
  setStoredWalletAddress(address);
  setStoredPeraNetwork(getPeraNetwork());
  return address;
}

export async function disconnectPeraWallet(): Promise<void> {
  await peraWallet.disconnect().catch(() => {});
  clearWalletSession();
}

export function getPeraWallet() {
  return peraWallet;
}

export function getConnectedPeraAddress(): string {
  return getStoredWalletAddress();
}

export function createPeraX402Signer(walletAddress: string): ClientAvmSigner {
  return {
    get address() {
      return getStoredWalletAddress() || walletAddress;
    },
    async signTransactions(txns: Uint8Array[], indexesToSign?: number[]) {
      let activeAccount = "";

      // 1. Try reconnecting session if wallet is already connected
      if (peraWallet.isConnected) {
        try {
          const accounts = await peraWallet.reconnectSession();
          activeAccount = accounts[0] ?? "";
        } catch {
          // ignore
        }
      }

      // 2. If session is not connected or reconnect returned empty, prompt connection modal!
      if (!activeAccount || !peraWallet.isConnected) {
        try {
          const accounts = await peraWallet.connect();
          activeAccount = accounts[0] ?? "";
        } catch {
          throw new Error("Pera Wallet connection was cancelled or failed. Please connect your Pera Wallet.");
        }
      }

      if (!activeAccount) {
        throw new Error("Pera Wallet is not connected. Please connect your Pera Wallet.");
      }

      setStoredWalletAddress(activeAccount);

      const indicesToSign = indexesToSign ?? txns.map((_, index) => index);
      const signed = new Array<Uint8Array | null>(txns.length).fill(null);

      const txGroup: SignerTransaction[] = txns.map((txn, index) => {
        const decoded = algosdk.decodeUnsignedTransaction(txn);
        return {
          txn: decoded,
          signers: indicesToSign.includes(index) ? [activeAccount] : [],
        };
      });

      const result = await peraWallet.signTransaction([txGroup], activeAccount);

      let signedIndex = 0;
      for (const index of indicesToSign) {
        const signedTxn = result[signedIndex++];
        signed[index] = signedTxn instanceof Uint8Array ? signedTxn : null;
      }

      return signed;
    },
  };
}
