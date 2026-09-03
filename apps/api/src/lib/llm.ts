import { env } from "../config/env";

/**
 * LLM client supporting multiple providers selectable per agent:
 *
 * 1. Google Gemini (preferred) — uses the native `generateContent` REST API.
 * 2. OpenAI-compatible — used when only `OPENAI_API_KEY` is set
 *    (works with OpenAI, Azure, Together, local Ollama, etc.).
 * 3. Anthropic Claude — uses the `/v1/messages` REST API (`CLAUDE_API_KEY`).
 * 4. Groq — uses the OpenAI-compatible `/v1/chat/completions` endpoint.
 * 5. Ollama — local OpenAI-compatible endpoint (`OLLAMA_BASE_URL`, default `http://localhost:11434`).
 *
 * When no provider/key is available, agents fall back to deterministic demo output.
 */

export type LlmProvider = "openai" | "gemini" | "claude" | "groq" | "ollama";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmConfig {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  provider?: LlmProvider;
  model?: string;
}

export class LlmError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "LlmError";
    this.status = status;
  }
}

export function isLlmConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY || env.OPENAI_API_KEY || env.CLAUDE_API_KEY || env.GROQ_API_KEY || env.OLLAMA_BASE_URL);
}

function resolveProvider(provider?: LlmProvider): LlmProvider {
  if (provider) return provider;
  if (env.GEMINI_API_KEY) return "gemini";
  if (env.OPENAI_API_KEY) return "openai";
  if (env.CLAUDE_API_KEY) return "claude";
  if (env.GROQ_API_KEY) return "groq";
  if (env.OLLAMA_BASE_URL) return "ollama";
  return "gemini";
}

// ---------------------------------------------------------------------------
// Gemini (native generateContent API)
// ---------------------------------------------------------------------------
async function geminiCompletion(
  messages: ChatMessage[],
  config: LlmConfig,
): Promise<string> {
  const apiKey = env.GEMINI_API_KEY!;
  const model = env.GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Gemini has no separate "system" role; prepend it to the first user turn.
  const systemParts = messages
    .filter(m => m.role === "system")
    .map(m => m.content);
  const conversation = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  if (conversation.length === 0) {
    conversation.push({ role: "user", parts: [{ text: systemParts.join("\n") }] });
  } else if (systemParts.length > 0) {
    const first = conversation[0];
    if (first) {
      const existingText = first.parts.map(part => part.text ?? "").join("\n");
      first.parts = [{ text: `${systemParts.join("\n\n")}\n\n${existingText}` }];
    }
  }

  const body: Record<string, unknown> = {
    contents: conversation,
    generationConfig: {
      temperature: config.temperature ?? 0.4,
      maxOutputTokens: config.maxTokens ?? 800,
    },
  };

  if (config.jsonMode) {
    body.generationConfig = {
      ...(body.generationConfig as Record<string, unknown>),
      responseMimeType: "application/json",
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new LlmError(`Gemini request failed (${response.status}): ${errText.slice(0, 200)}`, response.status);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new LlmError("Gemini returned no content.", 502);
  }

  return text.trim();
}

// ---------------------------------------------------------------------------
// OpenAI-compatible fallback
// ---------------------------------------------------------------------------
async function openAiCompletion(
  messages: ChatMessage[],
  config: LlmConfig,
): Promise<string> {
  const baseUrl = env.LLM_BASE_URL ?? "https://api.openai.com/v1";
  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages,
      temperature: config.temperature ?? 0.4,
      max_tokens: config.maxTokens ?? 800,
      response_format: config.jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LlmError(`LLM request failed (${response.status}): ${body.slice(0, 200)}`, response.status);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new LlmError("LLM returned no content.", 502);
  }

  return content.trim();
}

// ---------------------------------------------------------------------------
// Anthropic Claude
// ---------------------------------------------------------------------------
async function claudeCompletion(
  messages: ChatMessage[],
  config: LlmConfig,
): Promise<string> {
  const apiKey = env.CLAUDE_API_KEY!;
  const model = config.model ?? "claude-3-5-sonnet-latest";
  const systemParts = messages.filter(m => m.role === "system").map(m => m.content);
  const conversation = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: config.maxTokens ?? 800,
      temperature: config.temperature ?? 0.4,
      ...(systemParts.length ? { system: systemParts.join("\n\n") } : {}),
      messages: conversation,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LlmError(`Claude request failed (${response.status}): ${body.slice(0, 200)}`, response.status);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find(block => block.type === "text")?.text;
  if (typeof text !== "string") {
    throw new LlmError("Claude returned no content.", 502);
  }
  return text.trim();
}

// ---------------------------------------------------------------------------
// OpenAI-compatible chat completions (used by Groq + Ollama)
// ---------------------------------------------------------------------------
async function openAiCompatCompletion(
  endpoint: string,
  apiKey: string | undefined,
  model: string,
  messages: ChatMessage[],
  config: LlmConfig,
): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: config.temperature ?? 0.4,
      max_tokens: config.maxTokens ?? 800,
      response_format: config.jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LlmError(`LLM request failed (${response.status}): ${body.slice(0, 200)}`, response.status);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new LlmError("LLM returned no content.", 502);
  }
  return content.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function chatCompletion(
  messages: ChatMessage[],
  config: LlmConfig = {},
): Promise<string> {
  const provider = resolveProvider(config.provider);

  switch (provider) {
    case "gemini":
      if (!env.GEMINI_API_KEY) break;
      return geminiCompletion(messages, config);
    case "claude":
      if (!env.CLAUDE_API_KEY) break;
      return claudeCompletion(messages, config);
    case "groq":
      if (!env.GROQ_API_KEY) break;
      return openAiCompatCompletion(
        "https://api.groq.com/openai/v1/chat/completions",
        env.GROQ_API_KEY,
        config.model ?? "llama-3.3-70b-versatile",
        messages,
        config,
      );
    case "ollama":
      if (!env.OLLAMA_BASE_URL) break;
      return openAiCompatCompletion(
        `${env.OLLAMA_BASE_URL.replace(/\/$/, "")}/v1/chat/completions`,
        undefined,
        config.model ?? "llama3.1",
        messages,
        config,
      );
    case "openai":
    default:
      if (!env.OPENAI_API_KEY) break;
      return openAiCompletion(messages, config);
  }

  throw new LlmError("No LLM provider configured for the selected provider.", 503);
}

/** Ask the LLM to return a JSON object, with a safe fallback. */
export async function chatCompletionJson(
  messages: ChatMessage[],
  config: LlmConfig = {},
): Promise<Record<string, unknown>> {
  const raw = await chatCompletion(messages, { ...config, jsonMode: true });

  // Strip markdown code fences if present.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return parsed;
  } catch {
    throw new LlmError("LLM returned invalid JSON.", 502);
  }
}
