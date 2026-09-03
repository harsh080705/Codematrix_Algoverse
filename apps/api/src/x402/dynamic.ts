import type { Context, Next } from "hono";
import { x402HTTPResourceServer } from "@x402/core/server";
import { AgentModel } from "../models";
import { env } from "../config/env";
import { buildX402Routes } from "./routes";

/**
 * Dynamic x402 route synchronization.
 *
 * The `paymentMiddleware` from @x402/hono builds an `x402HTTPResourceServer`
 * whose route table (`compiledRoutes`) is fixed at construction time. To support
 * a no-code marketplace where developers publish agents at runtime without
 * backend changes or restarts, we refresh that route table from the database
 * on a throttled basis before each protected request.
 *
 * This is the scalable foundation for tens of developers and thousands of
 * published agents: any approved agent automatically receives x402 protection.
 */

interface CompiledRoute {
  verb: string;
  regex: RegExp;
  config: unknown;
  pattern: string;
}

let httpServer: x402HTTPResourceServer | null = null;
let lastSync = 0;
let syncPromise: Promise<void> | null = null;

const SYNC_INTERVAL_MS = 5000;

/** Register the underlying x402 HTTP resource server to refresh. */
export function attachX402HttpServer(server: x402HTTPResourceServer): void {
  httpServer = server;
}

/** Rebuild the route table from all approved agents in the database. */
export async function refreshApprovedAgentRoutes(force = false): Promise<void> {
  if (!httpServer) return;

  const now = Date.now();
  if (!force && now - lastSync < SYNC_INTERVAL_MS) return;
  lastSync = now;

  const approvedAgents = await AgentModel.find({ status: "approved" })
    .select("name price ownerDeveloperId status slug")
    .lean();

  const routes = buildX402Routes(approvedAgents as never);
  const compiledRoutes: CompiledRoute[] = Object.entries(routes).map(([pattern, config]) => ({
    ...parseRoutePattern(pattern),
    pattern,
    config,
  }));

  (httpServer as unknown as { compiledRoutes: CompiledRoute[] }).compiledRoutes = compiledRoutes;
}

/** Throttled, deduplicated refresh used as a Hono middleware. */
export function syncX402RoutesMiddleware(c: Context, next: Next): Promise<Response | void> {
  if (!syncPromise) {
    syncPromise = refreshApprovedAgentRoutes()
      .catch(error => {
        console.warn("[x402] dynamic route sync failed:", error);
      })
      .finally(() => {
        syncPromise = null;
      });
  }
  return syncPromise.then(() => next());
}

/** Rebuild the route table immediately (call after publish/approve). */
export function syncX402RoutesNow(): Promise<void> {
  return refreshApprovedAgentRoutes(true);
}

function parseRoutePattern(pattern: string): { verb: string; regex: RegExp; path: string } {
  const [rawVerb, rawPath] = pattern.includes(" ") ? pattern.split(/\s+/, 2) : ["*", pattern];
  const verb = rawVerb ?? "*";
  const path = rawPath ?? pattern;
  const regex = new RegExp(
    `^${path
      .replace(/\\/g, "\\\\")
      .replace(/[$()+.?^{|}]/g, "\\$&")
      .replace(/\*/g, ".*?")
      .replace(/\[([^\]]+)\]/g, "[^/]+")
      .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "[^/]+")
      .replace(/\//g, "\\/")}$`,
    "i",
  );
  return { verb: verb.toUpperCase(), regex, path };
}

export { env };
