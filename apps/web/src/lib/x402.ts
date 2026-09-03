import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import type { ClientAvmSigner } from "@x402/avm";

export function createPaidFetch(walletSigner: ClientAvmSigner, network = "algorand:testnet") {
  return wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: network as `${string}:${string}`,
        client: new ExactAvmScheme(walletSigner),
      },
    ],
  });
}
