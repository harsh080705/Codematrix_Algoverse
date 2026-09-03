import { SAMPLE_AGENTS } from "@aihub/shared";
import { buildDynamicAgent, runAgentDefinition } from "./agents/agent-definition";

type AgentInput = Record<string, unknown>;

/**
 * Per-slug default configuration for the built-in sample agents.
 *
 * These are used as the deterministic demo fallback and as the default config
 * when seeding agents. Real, developer-created agents are executed entirely
 * from their database `config` (see buildDynamicAgentFromConfig).
 */
const SAMPLE_DEFAULTS: Record<string, { systemPrompt: string; tools?: string[] }> = {
  "resume-analyzer": {
    systemPrompt:
      "You are a senior career coach and ATS (Applicant Tracking System) expert. " +
      "Analyze the resume text for clarity, measurable impact, and ATS keyword coverage. " +
      "Be specific and actionable.",
    tools: ["calculator"],
  },
};

/**
 * Executes an agent dynamically by slug.
 *
 * Uses the per-slug default config (system prompt + tools) to build a dynamic
 * definition. When an LLM is configured, this runs the full agent loop. When no
 * LLM key is configured, it falls back to the deterministic demo output so the
 * marketplace remains fully usable offline / for demos.
 */
export async function executeSampleAgent(
  slug: string,
  input: AgentInput,
): Promise<Record<string, unknown>> {
  const sample = SAMPLE_AGENTS.find(item => item.slug === slug);
  const defaults = SAMPLE_DEFAULTS[slug] ?? SAMPLE_DEFAULTS["resume-analyzer"]!;

  const definition = buildDynamicAgent({
    slug,
    name: sample?.name ?? "AI Agent",
    systemPrompt: defaults.systemPrompt,
    tools: defaults.tools,
  });

  const result = await runAgentDefinition(definition, input);

  // Surface agent-loop metadata without breaking the existing response shape.
  return {
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
}
