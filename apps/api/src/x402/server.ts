import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { ExactAvmScheme } from "@x402/avm/exact/server";
import { env } from "../config/env";

export function createX402ResourceServer(): x402ResourceServer {
  const facilitatorClient = new HTTPFacilitatorClient({ url: env.X402_FACILITATOR_URL });
  const server = new x402ResourceServer(facilitatorClient);
  server.register("algorand:*", new ExactAvmScheme());
  return server;
}
