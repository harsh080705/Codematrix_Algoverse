import {
  AgentModel,
  AgentToolModel,
  AgentVersionModel,
  ExecutionLogModel,
  FavoriteModel,
  ReviewModel,
  UsageLogModel,
  DeveloperModel,
  TransactionModel,
} from "../models";
import { executeSampleAgent } from "../lib/sample-agents";
import { buildDynamicAgentFromConfig, runAgentDefinition } from "../lib/agents/agent-definition";
import { env } from "../config/env";
import {
  createDemoTransaction,
  demoAgents,
  getDemoAgentById,
  listDemoAgents,
  runDemoAgent,
} from "../lib/demo-store";
import type { AgentConfig } from "@aihub/shared";

export async function listAgents(filters: {
  search?: string;
  category?: string;
  status?: string;
  featured?: boolean;
  page: number;
  limit: number;
  sort: string;
}) {
  if (env.DEMO_MODE) {
    const filtered = listDemoAgents().filter(agent => {
      const matchesSearch = !filters.search || `${agent.name} ${agent.description} ${agent.category}`.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = !filters.category || agent.category === filters.category;
      const matchesStatus = !filters.status || agent.status === filters.status;
      const matchesFeatured = typeof filters.featured !== "boolean" || agent.featured === filters.featured;
      return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sort) {
        case "top-rated":
          return b.averageRating - a.averageRating;
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        case "lowest-price":
          return a.price - b.price;
        case "highest-price":
          return b.price - a.price;
        case "most-used":
          return b.totalRuns - a.totalRuns;
        default:
          return b.totalRuns - a.totalRuns;
      }
    });

    const skip = (filters.page - 1) * filters.limit;
    const items = sorted.slice(skip, skip + filters.limit).map(agent => ({
      ...agent,
      ownerDeveloperId: agent.ownerDeveloperId,
    }));

    return { items, total: filtered.length, page: filters.page, limit: filters.limit };
  }

  const query: Record<string, unknown> = {};

  if (filters.search) {
    query.$or = [
      { name: new RegExp(filters.search, "i") },
      { description: new RegExp(filters.search, "i") },
      { tags: new RegExp(filters.search, "i") },
    ];
  }

  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;
  if (typeof filters.featured === "boolean") query.featured = filters.featured;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    trending: { trending: -1, totalRuns: -1 },
    "top-rated": { averageRating: -1, reviewCount: -1 },
    newest: { createdAt: -1 },
    "lowest-price": { price: 1 },
    "highest-price": { price: -1 },
    "most-used": { totalRuns: -1 },
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    AgentModel.find(query).populate("ownerDeveloperId").sort(sortMap[filters.sort] ?? { totalRuns: -1 }).skip(skip).limit(filters.limit),
    AgentModel.countDocuments(query),
  ]);

  return { items, total, page: filters.page, limit: filters.limit };
}

export async function getAgentById(id: string) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(id);
    if (!agent) {
      throw new Error("Agent not found");
    }

    return {
      ...agent,
      ownerDeveloperId: {
        companyName: "Nova Labs",
        bio: "Demo publisher for AIHub sample agents.",
      },
    };
  }

  const agent = await AgentModel.findById(id).populate("ownerDeveloperId").lean();
  if (!agent) {
    throw new Error("Agent not found");
  }

  return agent;
}

export async function createAgent(input: Record<string, unknown>, developerId: string) {
  if (env.DEMO_MODE) {
    const agent = {
      _id: `demo-${Date.now()}`,
      ...input,
      ownerDeveloperId: developerId,
      commissionRate: 0.1,
      developerShare: 0.9,
      marketplaceShare: 0.1,
      status: "pending",
    };

    demoAgents.unshift(agent as never);
    return agent as never;
  }

  const agent = await AgentModel.create({
    ...input,
    ownerDeveloperId: developerId,
    commissionRate: 0.1,
    developerShare: 0.9,
    marketplaceShare: 0.1,
    status: "pending",
  });

  // Persist selected tools into the AgentTool collection.
  const tools = (input.config as Partial<AgentConfig> | undefined)?.tools ?? [];
  if (tools.length) {
    await AgentToolModel.insertMany(
      tools.map(tool => ({
        agentId: agent._id,
        name: tool.name,
        enabled: tool.enabled,
        config: tool.config ?? {},
      })),
    );
  }

  return agent;
}

export async function updateAgent(id: string, input: Record<string, unknown>) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(id);
    if (!agent) throw new Error("Agent not found");
    Object.assign(agent, input, { updatedAt: new Date().toISOString() });
    return agent as never;
  }

  const agent = await AgentModel.findByIdAndUpdate(id, input, { new: true });
  if (!agent) throw new Error("Agent not found");

  // Sync tool collection when config changes.
  const tools = (input.config as Partial<AgentConfig> | undefined)?.tools;
  if (tools) {
    await AgentToolModel.deleteMany({ agentId: id });
    await AgentToolModel.insertMany(
      tools.map(tool => ({
        agentId: id,
        name: tool.name,
        enabled: tool.enabled,
        config: tool.config ?? {},
      })),
    );
  }

  return agent;
}

export async function deleteAgent(id: string) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(id);
    if (!agent) throw new Error("Agent not found");
    agent.status = "disabled";
    return agent as never;
  }

  const agent = await AgentModel.findByIdAndDelete(id);
  if (!agent) throw new Error("Agent not found");
  await AgentToolModel.deleteMany({ agentId: id });
  return agent;
}

export async function publishAgent(id: string, developerId: string, opts?: { price?: number }) {
  const update: Record<string, unknown> = {};
  if (typeof opts?.price === "number") {
    update.price = opts.price;
    update.config = { ...(await getAgentConfig(id)), pricing: { ...(await getAgentConfig(id)).pricing, pricePerRequest: opts.price } };
  }

  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(id);
    if (!agent) throw new Error("Agent not found");
    agent.status = opts?.price ? "pending" : "approved";
    if (opts?.price) agent.price = opts.price;
    return agent as never;
  }

  const agent = await AgentModel.findById(id);
  if (!agent) throw new Error("Agent not found");
  if (String(agent.ownerDeveloperId) !== developerId) throw new Error("Not your agent");

  // Published agents start as "pending" and require admin approval to go live.
  agent.status = "pending";
  if (typeof opts?.price === "number") {
    agent.price = opts.price;
    if (agent.config) {
      agent.config.pricing = { ...agent.config.pricing, pricePerRequest: opts.price };
    }
  }
  await agent.save();
  return agent;
}

export async function unpublishAgent(id: string, developerId: string) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(id);
    if (!agent) throw new Error("Agent not found");
    agent.status = "disabled";
    return agent as never;
  }

  const agent = await AgentModel.findById(id);
  if (!agent) throw new Error("Agent not found");
  if (String(agent.ownerDeveloperId) !== developerId) throw new Error("Not your agent");
  agent.status = "disabled";
  agent.disabledReason = "Unpublished by developer";
  await agent.save();
  return agent;
}

export async function cloneAgent(id: string, developerId: string, opts?: { name?: string; slug?: string }) {
  const source =
    env.DEMO_MODE
      ? getDemoAgentById(id)
      : await AgentModel.findById(id).lean();

  if (!source) throw new Error("Agent not found");

  const newSlug = opts?.slug ?? `${source.slug}-clone-${Date.now().toString(36)}`;
  const newName = opts?.name ?? `${source.name} (Clone)`;

  if (env.DEMO_MODE) {
    const clone = {
      ...source,
      _id: `demo-${Date.now()}`,
      slug: newSlug,
      name: newName,
      status: "draft",
      totalRuns: 0,
      favoritesCount: 0,
      averageRating: 0,
      reviewCount: 0,
      ownerDeveloperId: developerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoAgents.unshift(clone as never);
    return clone as never;
  }

  const { _id, versions, screenshots, totalRuns, favoritesCount, averageRating, reviewCount, ...rest } = source;
  const clone = await AgentModel.create({
    ...rest,
    name: newName,
    slug: newSlug,
    status: "draft",
    totalRuns: 0,
    favoritesCount: 0,
    averageRating: 0,
    reviewCount: 0,
    ownerDeveloperId: developerId,
    versions: [],
    screenshots: screenshots ?? [],
  });

  // Clone the tool configuration.
  const sourceTools = await AgentToolModel.find({ agentId: id }).lean();
  if (sourceTools.length) {
    await AgentToolModel.insertMany(
      sourceTools.map(tool => ({
        agentId: clone._id,
        name: tool.name,
        enabled: tool.enabled,
        config: tool.config ?? {},
      })),
    );
  }

  return clone;
}

export async function versionAgent(id: string, developerId: string, input: { changelog: string; label?: string }) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(id);
    if (!agent) throw new Error("Agent not found");
    const nextMinor = (agent.versions?.length ?? 0) + 1;
    const version = `1.${nextMinor}.0`;
    agent.versions = [
      ...(agent.versions ?? []),
      { version, changelog: input.changelog, endpoint: agent.endpoint, active: true, createdAt: new Date().toISOString() },
    ];
    return agent as never;
  }

  const agent = await AgentModel.findById(id);
  if (!agent) throw new Error("Agent not found");
  if (String(agent.ownerDeveloperId) !== developerId) throw new Error("Not your agent");

  // Deactivate prior versions and create a new one.
  await AgentVersionModel.updateMany({ agentId: id }, { active: false });
  const nextMinor = (await AgentVersionModel.countDocuments({ agentId: id })) + 1;
  const version = `1.${nextMinor}.0`;

  const versionDoc = await AgentVersionModel.create({
    agentId: agent._id,
    version,
    label: input.label ?? `Release ${version}`,
    changelog: input.changelog,
    configSnapshot: (agent.config as unknown as Record<string, unknown>) ?? {},
    active: true,
    createdBy: developerId,
  });

  // Mirror into the embedded versions array for backward compatibility.
  agent.versions.push({
    version,
    changelog: input.changelog,
    endpoint: agent.endpoint,
    active: true,
    createdAt: new Date(),
  });
  await agent.save();

  return { agent, version: versionDoc };
}

export async function runAgent(agentId: string, userId: string, input: Record<string, unknown>) {
  if (env.DEMO_MODE) {
    return runDemoAgent(agentId, input);
  }

  const agent = await AgentModel.findById(agentId).populate("ownerDeveloperId");
  if (!agent || agent.status !== "approved") {
    throw new Error("Agent is not available");
  }

  const startedAt = Date.now();
  const definition = buildDynamicAgentFromConfig(agent as never);
  let output: Record<string, unknown>;
  let usedLlm = false;
  let toolsUsed: string[] = [];
  let provider = "";
  let model = "";
  let errorMessage: string | undefined;

  try {
    // Config-driven execution: use the persisted config (prompt, model,
    // temperature, maxTokens, tools) to run the live agent loop.
    const result = await runAgentDefinition(definition, input);
    output = {
      ...result.output,
      ...(result.usedLlm
        ? {
            _agentMeta: {
              agent: result.agent,
              reasoning: result.reasoning,
              toolsUsed: result.toolsUsed,
              latencyMs: result.latencyMs,
            },
          }
        : {}),
    };
    usedLlm = result.usedLlm;
    toolsUsed = result.toolsUsed;
    provider = definition.provider ?? "";
    model = definition.model ?? "";
  } catch (error) {
    // Fallback to the deterministic output if the config-driven run fails.
    errorMessage = error instanceof Error ? error.message : String(error);
    output = definition.demoRun(input);
  }

  const latencyMs = Date.now() - startedAt;
  const status = errorMessage ? "error" : "success";

  await Promise.all([
    AgentModel.findByIdAndUpdate(agentId, {
      $inc: { totalRuns: 1 },
      ...(status === "success"
        ? { $inc: { tokensUsed: 0 } }
        : {}),
    }),
    ExecutionLogModel.create({
      agentId,
      userId,
      status,
      latencyMs,
      tokensUsed: 0,
      toolsUsed,
      provider,
      model,
      inputPreview: JSON.stringify(input).slice(0, 500),
      outputPreview: JSON.stringify(output).slice(0, 500),
      errorMessage,
    }),
    UsageLogModel.create({
      agentId,
      userId,
      latencyMs,
      statusCode: status === "success" ? 200 : 500,
      requestPath: `/api/agents/${agentId}/run`,
      requestMethod: "POST",
    }),
  ]);

  return { agent, output, latencyMs, usedLlm, toolsUsed };
}

async function getAgentConfig(id: string): Promise<AgentConfig> {
if (env.DEMO_MODE) {
    const agent = getDemoAgentById(id);
    return (agent?.config as unknown as AgentConfig) ?? ({} as AgentConfig);
  }
const agent = await AgentModel.findById(id).lean();
  return (agent?.config as unknown as AgentConfig) ?? ({} as AgentConfig);
}

export async function favoriteAgent(userId: string, agentId: string) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(agentId);
    if (agent) {
      agent.favoritesCount += 1;
    }
    return;
  }

  await FavoriteModel.updateOne({ userId, agentId }, { userId, agentId }, { upsert: true });
  await AgentModel.findByIdAndUpdate(agentId, { $inc: { favoritesCount: 1 } });
}

export async function unfavoriteAgent(userId: string, agentId: string) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(agentId);
    if (agent) {
      agent.favoritesCount = Math.max(0, agent.favoritesCount - 1);
    }
    return;
  }

  await FavoriteModel.deleteOne({ userId, agentId });
  await AgentModel.findByIdAndUpdate(agentId, { $inc: { favoritesCount: -1 } });
}

export async function addReview(input: { agentId: string; userId: string; rating: number; title: string; comment: string; }) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(input.agentId);
    if (agent) {
      agent.reviewCount += 1;
      agent.averageRating = Number(((agent.averageRating * (agent.reviewCount - 1) + input.rating) / agent.reviewCount).toFixed(1));
    }
    return {
      _id: `demo-review-${Date.now()}`,
      ...input,
      createdAt: new Date().toISOString(),
    } as never;
  }

  const review = await ReviewModel.findOneAndUpdate(
    { agentId: input.agentId, userId: input.userId },
    input,
    { upsert: true, new: true },
  );

  const aggregate = await ReviewModel.aggregate([
    { $match: { agentId: review.agentId } },
    {
      $group: {
        _id: "$agentId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const stats = aggregate[0];
  if (stats) {
    await AgentModel.findByIdAndUpdate(review.agentId, {
      averageRating: stats.averageRating,
      reviewCount: stats.totalReviews,
    });
  }

  return review;
}

export async function approveDeveloper(developerId: string) {
  if (env.DEMO_MODE) {
    return {
      _id: developerId,
      approved: true,
      approvedAt: new Date(),
    } as never;
  }

  const developer = await DeveloperModel.findByIdAndUpdate(
    developerId,
    { approved: true, approvedAt: new Date() },
    { new: true },
  );

  if (!developer) throw new Error("Developer not found");
  return developer;
}

export async function listDeveloperAgents(developerId: string) {
  if (env.DEMO_MODE) {
    return demoAgents.filter(agent => agent.ownerDeveloperId === developerId);
  }
  return AgentModel.find({ ownerDeveloperId: developerId }).sort({ createdAt: -1 }).lean();
}

export async function listAgentVersions(agentId: string) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(agentId);
    return agent?.versions ?? [];
  }
  return AgentVersionModel.find({ agentId }).sort({ createdAt: -1 }).lean();
}

export async function listAgentTools(agentId: string) {
  if (env.DEMO_MODE) {
    const agent = getDemoAgentById(agentId);
    return ((agent?.config as Partial<AgentConfig>)?.tools ?? []).map(tool => ({
      name: tool.name,
      enabled: tool.enabled,
      config: tool.config ?? {},
    }));
  }
  return AgentToolModel.find({ agentId }).lean();
}
