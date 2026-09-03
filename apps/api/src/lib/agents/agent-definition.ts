import { chatCompletionJson, isLlmConfigured, LlmError, type LlmProvider } from "../llm";
import { resolveTools } from "./tools";
import type { AgentConfig } from "@aihub/shared";

/**
 * A config-driven AI Agent definition.
 *
 * Each agent has its own system prompt, tool list, and execution strategy.
 * When an LLM is configured, it runs a real agent loop (plan -> reason ->
 * use tools -> observe -> respond). When no LLM key is present, it falls back
 * to a deterministic demo response so the marketplace still works offline.
 */

export interface AgentTool {
  name: string;
  description: string;
  /** Execute the tool. Returns an observation string. */
  run: (args: Record<string, unknown>) => Promise<string> | string;
}

export interface AgentRunResult {
  agent: string;
  output: Record<string, unknown>;
  reasoning: string[];
  toolsUsed: string[];
  usedLlm: boolean;
  latencyMs: number;
}

export interface AgentDefinition {
  slug: string;
  name: string;
  systemPrompt: string;
  tools: AgentTool[];
  /** Deterministic fallback when no LLM is configured. */
  demoRun: (input: Record<string, unknown>) => Record<string, unknown>;
  /** Optional LLM routing overrides (provider, model, temperature, maxTokens). */
  provider?: LlmProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const text = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "";
  return JSON.stringify(value);
};

const summarize = (input: Record<string, unknown>): string =>
  Object.entries(input)
    .map(([key, val]) => `${key}: ${text(val)}`)
    .join("\n");

/**
 * Builds a runnable AgentDefinition from a persisted AgentConfig.
 *
 * This is the heart of the no-code marketplace: every agent is created
 * dynamically from its database configuration (prompt, model, temperature,
 * tokens, selected tools). No backend code changes are required to add agents.
 */
export function buildDynamicAgent(config: {
  slug: string;
  name: string;
  systemPrompt: string;
  instructions?: string;
  tools?: string[];
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): AgentDefinition {
  const systemPrompt = [
    config.systemPrompt,
    config.instructions ? `Instructions:\n${config.instructions}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const tools = resolveTools(config.tools ?? []);

  return {
    slug: config.slug,
    name: config.name,
    systemPrompt: systemPrompt || "You are a helpful AI agent.",
    tools,
    provider: (config.provider as LlmProvider) || undefined,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    demoRun: input => ({
      summary: `${config.name} processed the request.`,
      agent: config.name,
      echo: input,
      toolsEnabled: tools.map(tool => tool.name),
    }),
  };
}

/**
 * Builds a runnable AgentDefinition directly from a persisted AgentConfig.
 */
export function buildDynamicAgentFromConfig(
  agent: { slug: string; name: string; config?: Partial<AgentConfig> },
): AgentDefinition {
  const cfg = (agent.config ?? {}) as Partial<AgentConfig>;
  const ai = (cfg.ai ?? {}) as Partial<AgentConfig["ai"]>;
  return buildDynamicAgent({
    slug: agent.slug,
    name: agent.name,
    systemPrompt: ai.systemPrompt ?? "",
    instructions: ai.instructions ?? "",
    tools: (cfg.tools ?? []).map(tool => tool.name),
    provider: ai.provider,
    model: ai.model,
    temperature: ai.temperature,
    maxTokens: ai.maxTokens,
  });
}

/**
 * Executes the core agent loop.
 *
 * 1. Planning — the agent reasons about the task and picks tools.
 * 2. Execution — it runs the selected tools with arguments.
 * 3. Observation — each tool returns structured observations.
 * 4. Response — the LLM synthesizes a final JSON answer from observations.
 */
export async function runAgentDefinition(
  definition: AgentDefinition,
  input: Record<string, unknown>,
): Promise<AgentRunResult> {
  const startedAt = Date.now();
  const reasoning: string[] = [];
  const toolsUsed: string[] = [];
  const llmConfig = {
    provider: definition.provider,
    model: definition.model,
  };

  if (!isLlmConfigured()) {
    // Deterministic fallback so the demo works without keys.
    return {
      agent: definition.name,
      output: definition.demoRun(input),
      reasoning: ["No LLM configured; returning deterministic demo output."],
      toolsUsed: [],
      usedLlm: false,
      latencyMs: Date.now() - startedAt,
    };
  }

  const toolDescriptions = definition.tools
    .map(tool => `- ${tool.name}: ${tool.description}`)
    .join("\n");

  // --- Planning & tool selection ---
  reasoning.push("Planning: selecting tools and drafting a plan.");
  const plan = await chatCompletionJson(
    [
      { role: "system", content: definition.systemPrompt },
      {
        role: "user",
        content: [
          `Available tools:\n${toolDescriptions || "(none)"}`,
          `User input:\n${summarize(input)}`,
          'Return a JSON object with keys: "plan" (string), "tools" (array of {name, args}) to call in order.',
        ].join("\n\n"),
      },
    ],
    {
      ...llmConfig,
      temperature: 0.3,
      maxTokens: Math.min(400, definition.maxTokens ?? 400),
    },
  );

  reasoning.push(`Plan: ${text(plan.plan)}`);
  const toolCalls = Array.isArray(plan.tools)
    ? (plan.tools as Array<{ name: string; args?: Record<string, unknown> }>)
    : [];

  // --- Execution & observation ---
  const observations: string[] = [];
  for (const call of toolCalls) {
    const tool = definition.tools.find(item => item.name === call.name);
    if (!tool) {
      observations.push(`Tool "${call.name}" not found.`);
      continue;
    }

    toolsUsed.push(call.name);
    reasoning.push(`Executing tool: ${call.name}`);
    try {
      const result = await tool.run(call.args ?? {});
      observations.push(`${call.name}: ${result}`);
    } catch (error) {
      observations.push(`${call.name}: error -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  reasoning.push("Observation: gathered tool outputs.");

  // --- Final response synthesis ---
  const final = await chatCompletionJson(
    [
      { role: "system", content: definition.systemPrompt },
      {
        role: "user",
        content: [
          `User input:\n${summarize(input)}`,
          `Your plan:\n${text(plan.plan)}`,
          `Tool observations:\n${observations.join("\n") || "(no tools run)"}`,
          'Return the final answer as a JSON object with a "summary" string and any other relevant keys.',
        ].join("\n\n"),
      },
    ],
    {
      ...llmConfig,
      temperature: definition.temperature ?? 0.4,
      maxTokens: definition.maxTokens ?? 800,
    },
  );

  reasoning.push("Synthesized final response.");

  return {
    agent: definition.name,
    output: final,
    reasoning,
    toolsUsed,
    usedLlm: true,
    latencyMs: Date.now() - startedAt,
  };
}

export { text, LlmError };
