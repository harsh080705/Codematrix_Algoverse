declare module "hono" {
  interface ContextVariableMap {
    auth: {
      userId: string;
      role: string;
      email: string;
      walletAddress?: string;
    };
    paymentDraft: {
      agentId: string;
      userId: string;
      developerId: string;
      amount: number;
      network: "algorand:mainnet" | "algorand:testnet";
      walletAddress: string;
    };
    transactionId: string;
  }
}

export {};