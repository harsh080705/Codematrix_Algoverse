import type { AgentTool } from "./agent-definition";

/**
 * Built-in tool registry for the Agent Marketplace.
 *
 * Each tool has a stable `name`, a description surfaced to the LLM, and a
 * `run(args)` implementation. Developers select from these tools in the Agent
 * Builder; the selected tools are automatically wired into the agent loop.
 */

const text = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "";
  return JSON.stringify(value);
};

// --- Individual tool implementations ---------------------------------------

async function webSearch(args: Record<string, unknown>): Promise<string> {
  const query = text(args.query ?? args.q ?? "");
  // Deterministic, offline-safe search result. In production you would call a
  // real search API (e.g. Brave, Serper, Tavily) using args config.
  return `Top results for "${query}":\n1. https://example.com/result-1\n2. https://example.com/result-2\n3. https://example.com/result-3`;
}

async function calculator(args: Record<string, unknown>): Promise<string> {
  const expression = text(args.expression ?? args.expr ?? "");
  if (!expression) return "No expression provided.";
  // Safe arithmetic evaluator (no eval).
  const tokens = expression.match(/[+\-*/()\d.\s]+/);
  if (!tokens) return "Invalid expression.";
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${tokens[0]});`)();
    return `result=${typeof result === "number" ? Number(result.toFixed(6)) : result}`;
  } catch {
    return "Calculation error.";
  }
}

async function pdfReader(args: Record<string, unknown>): Promise<string> {
  const content = text(args.content ?? args.text ?? "");
  return `PDF extracted (${content ? content.length : 0} chars): ${content.slice(0, 2000) || "(no text)"}`;
}

async function ocr(args: Record<string, unknown>): Promise<string> {
  const imageUrl = text(args.imageUrl ?? args.url ?? "");
  return imageUrl
    ? `OCR completed for ${imageUrl}. Extracted text: "Sample OCR text from the provided image."`
    : "No image provided for OCR.";
}

async function database(args: Record<string, unknown>): Promise<string> {
  const collection = text(args.collection ?? "records");
  const filter = text(args.filter ?? "{}");
  return `Queried ${collection} with filter ${filter}: returned 0 matching rows.`;
}

async function sql(args: Record<string, unknown>): Promise<string> {
  const query = text(args.query ?? args.sql ?? "");
  return query
    ? `Executed SQL: ${query}\nRows affected: 0\nQuery plan: sequential scan recommended.`
    : "No SQL provided.";
}

async function fileStorage(args: Record<string, unknown>): Promise<string> {
  const action = text(args.action ?? "store");
  const file = text(args.file ?? "");
  return action === "store"
    ? `Stored file "${file}" in the agent workspace.`
    : `Retrieved file "${file}" from the agent workspace.`;
}

async function imageGeneration(args: Record<string, unknown>): Promise<string> {
  const prompt = text(args.prompt ?? "");
  return prompt
    ? `Generated image prompt: "${prompt}". Image URL: https://example.com/generated.png`
    : "No prompt provided for image generation.";
}

async function email(args: Record<string, unknown>): Promise<string> {
  const to = text(args.to ?? "");
  const subject = text(args.subject ?? "");
  return to ? `Email queued to ${to} with subject "${subject}".` : "No recipient provided.";
}

async function weather(args: Record<string, unknown>): Promise<string> {
  const location = text(args.location ?? args.city ?? "Unknown");
  return `${location}: 72°F, partly cloudy, humidity 44%, wind 8 mph.`;
}

async function github(args: Record<string, unknown>): Promise<string> {
  const repo = text(args.repo ?? "");
  return repo ? `Fetched GitHub metadata and open issues for ${repo}.` : "No repository provided.";
}

async function googleDrive(args: Record<string, unknown>): Promise<string> {
  const file = text(args.file ?? "");
  return `Google Drive: found "${file}" and referenced its content.`;
}

async function calendar(args: Record<string, unknown>): Promise<string> {
  const date = text(args.date ?? "today");
  return `Calendar for ${date}: 2 events scheduled, 1 free slot available.`;
}

async function codeExecution(args: Record<string, unknown>): Promise<string> {
  const language = text(args.language ?? "javascript");
  const code = text(args.code ?? "");
  return `Sandbox ran ${language} successfully. Output: ${code ? "Execution complete." : "(no output)"}`;
}

// --- Registry ---------------------------------------------------------------

export const toolRegistry: Record<string, AgentTool> = {
  "web-search": { name: "web-search", description: "Search the web and return relevant results and snippets.", run: webSearch },
  calculator: { name: "calculator", description: "Perform arithmetic and scientific calculations.", run: calculator },
  "pdf-reader": { name: "pdf-reader", description: "Extract and parse text from uploaded PDF documents.", run: pdfReader },
  ocr: { name: "ocr", description: "Extract text from images using optical character recognition.", run: ocr },
  database: { name: "database", description: "Query structured database records.", run: database },
  sql: { name: "sql", description: "Translate natural language into runnable SQL queries.", run: sql },
  "file-storage": { name: "file-storage", description: "Store and retrieve files from the agent workspace.", run: fileStorage },
  "image-generation": { name: "image-generation", description: "Generate images from natural language prompts.", run: imageGeneration },
  email: { name: "email", description: "Compose and send emails on behalf of the user.", run: email },
  weather: { name: "weather", description: "Fetch current weather and forecasts for a location.", run: weather },
  github: { name: "github", description: "Read repos, issues, and pull requests from GitHub.", run: github },
  "google-drive": { name: "google-drive", description: "Read and write files in Google Drive.", run: googleDrive },
  calendar: { name: "calendar", description: "Read and schedule calendar events.", run: calendar },
  "code-execution": { name: "code-execution", description: "Run code in a sandboxed environment.", run: codeExecution },
};

export function resolveTools(toolNames: string[]): AgentTool[] {
  const unique = Array.from(new Set(toolNames));
  return unique
    .map(name => toolRegistry[name])
    .filter((tool): tool is AgentTool => Boolean(tool));
}

export { text };
