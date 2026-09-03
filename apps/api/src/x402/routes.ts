import type { AgentDocument } from "../models";
import { AgentModel } from "../models";
import { env } from "../config/env";
import type { RouteConfig } from "@x402/core/server";

export type X402RouteMap = Record<string, RouteConfig>;

/**
 * Builds the x402 route map from a list of approved agents.
 *
 * Any agent whose status is "approved" automatically receives x402 protection
 * for its `POST /agents/:id/run` endpoint. When an agent is created, published,
 * and approved, it is included here without backend code changes.
 */
export function buildX402Routes(
  agents: Array<
    Pick<AgentDocument, "name" | "price" | "ownerDeveloperId" | "status" | "slug"> & { _id: unknown }
  >,
): X402RouteMap {
  return agents.reduce<X402RouteMap>((routes, agent) => {
    const agentId = String(agent._id);
    routes[`POST /agents/${agentId}/run`] = {
      accepts: {
        scheme: "exact",
        network: env.X402_NETWORK as `${string}:${string}`,
        price: `$${agent.price.toFixed(2)}`,
        payTo: env.X402_PAY_TO,
        maxTimeoutSeconds: 60,
        extra: {
          agentId,
          slug: agent.slug,
          developerId: String(agent.ownerDeveloperId),
        },
      },
      description: `Pay-per-use execution for ${agent.name}`,
      mimeType: "application/json",
    };

    return routes;
  }, {});
}

/**
 * Dynamic x402 route resolver.
 *
 * Querying the database on every request guarantees that newly approved agents
 * are immediately protected by x402 without a server restart. This is the
 * scalable foundation for hundreds of developers and thousands of agents.
 */
export async function resolveX402Routes(): Promise<X402RouteMap> {
  const approvedAgents = await AgentModel.find({ status: "approved" })
    .select("name price ownerDeveloperId status slug")
    .lean();
  return buildX402Routes(approvedAgents as never);
}

/**
 * Builds the x402 route map for a single agent (used for hot-add after publish).
 */
export function buildX402RouteForAgent(
  agent: Pick<AgentDocument, "name" | "price" | "ownerDeveloperId" | "status" | "slug"> & { _id: unknown },
): X402RouteMap {
  return buildX402Routes([agent]);
}
