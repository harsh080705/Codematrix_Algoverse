import { createHmac } from "node:crypto";
import { z } from "zod";
import type { AgentDocument } from "../models";
import { env } from "../config/env";
import {
  buildDynamicAgentFromConfig,
  runAgentDefinition,
} from "../lib/agents/agent-definition";
import type {
  N8nAgentExecutionPayload,
  N8nAgentExecutionResponse,
} from "@aihub/shared";

const n8nSuccessSchema = z.object({
  success: z.literal(true),
  executionId: z.string().min(1),
  agentId: z.string().min(1),
  result: z.record(z.string(), z.any()),
  usage: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const n8nFailureSchema = z.object({
  success: z.literal(false),
  executionId: z.string().min(1),
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
});

const n8nResponseSchema = z.union([n8nSuccessSchema, n8nFailureSchema]);

function signPayload(body: string): string {
  if (!env.N8N_SHARED_SECRET) {
    return "";
  }

  return createHmac("sha256", env.N8N_SHARED_SECRET).update(body).digest("hex");
}

function buildPayload(input: {
  executionId: string;
  agentId: string;
  agentVersion?: string;
  userId: string;
  walletAddress: string;
  transactionId: string;
  amount: number;
  input: Record<string, unknown>;
  agent: Pick<
    AgentDocument,
    "name" | "inputSchema" | "outputSchema" | "config" | "price"
  > & {
    config?: NonNullable<AgentDocument["config"]>;
  };
}): N8nAgentExecutionPayload {
  const agentConfig =
    input.agent.config ?? ({} as NonNullable<AgentDocument["config"]>);

  return {
    executionId: input.executionId,
    agentId: input.agentId,
    agentVersion: input.agentVersion,
    userId: input.userId,
    walletAddress: input.walletAddress,
    transactionId: input.transactionId,
    paymentVerified: true,
    amount: input.amount.toFixed(2),
    currency: "USDC",
    input: input.input,
    agentConfig: {
      name: input.agent.name,
      systemPrompt: agentConfig.ai?.systemPrompt ?? "",
      model: agentConfig.ai?.model ?? "",
      temperature: agentConfig.ai?.temperature ?? 0.4,
      maxTokens: agentConfig.ai?.maxTokens ?? 800,
      tools: agentConfig.tools ?? [],
      inputSchema: input.agent.inputSchema ?? {},
      outputSchema: input.agent.outputSchema ?? {},
      n8nWorkflowId: agentConfig.n8nWorkflowId,
    },
  };
}

function normalizeN8nResponse(
  rawText: string,
  json: unknown,
  executionId: string,
  agentId: string,
): N8nAgentExecutionResponse {
  // Case 1: Standard structured response matching n8nResponseSchema
  const parsed = n8nResponseSchema.safeParse(json);
  if (parsed.success) {
    return parsed.data as N8nAgentExecutionResponse;
  }

  // Case 2: Array returned from n8n (e.g. [{ summary: "..." }] or [{ json: { text: "..." } }])
  if (Array.isArray(json) && json.length > 0) {
    const firstItem = json[0];
    const itemData =
      typeof firstItem === "object" && firstItem !== null && "json" in firstItem
        ? (firstItem as { json: unknown }).json
        : firstItem;

    const resultMap =
      typeof itemData === "object" && itemData !== null
        ? (itemData as Record<string, unknown>)
        : { summary: String(itemData) };

    return {
      success: true,
      executionId,
      agentId,
      result: resultMap,
      metadata: { n8nFormat: "array-normalized" },
    };
  }

  // Case 3: Single JSON Object returned from n8n (e.g. { summary: "...", output: "..." })
  if (typeof json === "object" && json !== null) {
    const record = json as Record<string, unknown>;

    if (record.error && typeof record.error === "string") {
      return {
        success: false,
        executionId,
        error: {
          code: "N8N_WORKFLOW_ERROR",
          message: record.error,
        },
      };
    }

    const resultData = record.result ?? record.data ?? record.output ?? record;
    const resultMap =
      typeof resultData === "object" && resultData !== null
        ? (resultData as Record<string, unknown>)
        : { summary: String(resultData) };

    return {
      success: true,
      executionId,
      agentId,
      result: resultMap,
      metadata: { n8nFormat: "object-normalized" },
    };
  }

  // Case 4: Raw text response from n8n
  const trimmed = rawText.trim();
  if (trimmed) {
    return {
      success: true,
      executionId,
      agentId,
      result: {
        summary: trimmed,
        output: trimmed,
      },
      metadata: { n8nFormat: "text-normalized" },
    };
  }

  // Case 5: Empty 200 OK response from n8n
  return {
    success: true,
    executionId,
    agentId,
    result: {
      summary: "Workflow executed successfully.",
      status: "completed",
    },
    metadata: { n8nFormat: "empty-normalized" },
  };
}

export async function executeAgentThroughN8n(input: {
  executionId: string;
  agentId: string;
  agentVersion?: string;
  userId: string;
  walletAddress: string;
  transactionId: string;
  amount: number;
  input: Record<string, unknown>;
  agent: Pick<
    AgentDocument,
    "name" | "inputSchema" | "outputSchema" | "config" | "price"
  > & {
    config?: NonNullable<AgentDocument["config"]>;
  };
}) {
  const payload = buildPayload(input);

  // Priority 1: Use specific agent's n8nWebhookUrl from DB config
  // Priority 2: Fall back to global environment N8N_WEBHOOK_URL
  const webhookUrl =
    ((input.agent.config as unknown) as Record<string, unknown> | undefined)?.n8nWebhookUrl as string | undefined ||
    input.agent.config?.n8nWebhookUrl?.trim() ||
    env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    const definition = buildDynamicAgentFromConfig(input.agent as never);
    const localResult = await runAgentDefinition(definition, input.input);
    return {
      success: true as const,
      executionId: input.executionId,
      agentId: input.agentId,
      result: localResult.output,
      usage: {
        model: definition.model,
        provider: definition.provider,
        tokens: 0,
      },
      metadata: {
        executionLayer: "local-fallback",
        toolsUsed: localResult.toolsUsed,
        latencyMs: localResult.latencyMs,
      },
    } satisfies N8nAgentExecutionResponse;
  }

  const body = JSON.stringify(payload);
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (env.N8N_SHARED_SECRET) {
    headers.set("X-AIHUB-SIGNATURE", signPayload(body));
    headers.set("X-AIHUB-SECRET", env.N8N_SHARED_SECRET);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.N8N_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    const rawText = await response.text().catch(() => "");
    let json: unknown = null;
    try {
      json = JSON.parse(rawText);
    } catch {
      json = null;
    }

    if (!response.ok) {
      console.error("[n8n] HTTP error from webhook URL:", webhookUrl, response.status, rawText);
      throw new Error(
        `n8n webhook (${webhookUrl}) failed (${response.status}): ${rawText || "No response body"}`,
      );
    }

    // Resilient normalization for any response shape returned by n8n webhooks
    return normalizeN8nResponse(rawText, json, input.executionId, input.agentId);
  } finally {
    clearTimeout(timeout);
  }
}
