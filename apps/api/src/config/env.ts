import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const insecureDefaultSecret = (value: string) => value.startsWith("aihub-demo-");
export const X402_ALGORAND_MAINNET = "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";
export const X402_ALGORAND_TESTNET = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";

const optionalUrl = () =>
  z.preprocess(value => {
    if (typeof value !== "string") return value;

    const normalized = value.trim();
    if (!normalized) return undefined;

    const lower = normalized.toLowerCase();
    if (lower === "undefined" || lower === "null" || lower === "none") return undefined;

    return normalized;
  }, z.string().url().optional());

function parseDotEnv(contents: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !(key in process.env)) {
      result[key] = value;
    }
  }

  return result;
}

function loadLocalEnvFile(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(process.cwd(), "..", "..", ".env"),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;

    const parsed = parseDotEnv(fs.readFileSync(candidate, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      process.env[key] = value;
    }
    return;
  }
}

loadLocalEnvFile();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DEMO_MODE: z.enum(["true", "false"]).default("true").transform(value => value === "true"),
  ALLOW_ADMIN_REGISTRATION: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
  MONGODB_URI: z.string().optional().default(""),
  JWT_SECRET: z
    .string()
    .min(32)
    .default("aihub-demo-access-secret-32-chars!!")
    .superRefine((value, ctx) => {
      if (process.env.NODE_ENV === "production" && insecureDefaultSecret(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "JWT_SECRET must be a strong random value in production (do not use the demo default).",
        });
      }
    }),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default("aihub-demo-refresh-secret-32-chars")
    .superRefine((value, ctx) => {
      if (process.env.NODE_ENV === "production" && insecureDefaultSecret(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "JWT_REFRESH_SECRET must be a strong random value in production (do not use the demo default).",
        });
      }
  }),
  X402_FACILITATOR_URL: z.string().url().default("https://facilitator.goplausible.xyz"),
  ENABLE_X402: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
  X402_NETWORK: z
    .enum(["algorand:mainnet", "algorand:testnet", X402_ALGORAND_MAINNET, X402_ALGORAND_TESTNET])
    .default("algorand:testnet")
    .transform(value => {
      if (value === "algorand:mainnet") return X402_ALGORAND_MAINNET;
      if (value === "algorand:testnet") return X402_ALGORAND_TESTNET;
      return value;
    }),
  X402_PAY_TO: z.string().min(25).default("SIHUNYIJLVMXKUH2WEFAFSWPL2RVF4VEI6D334CWIU6OBER22WE3SR3L2"),
  X402_ASSET: z.string().default("USDC"),
  AUTONOMOUS_PAYMENT_MNEMONIC: z.string().optional().default(""),
  ALGORAND_NETWORK: z.enum(["mainnet", "testnet"]).default("testnet"),
  ALGORAND_NODE_URL: optionalUrl(),
  ALGORAND_INDEXER_URL: optionalUrl(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  N8N_WEBHOOK_URL: optionalUrl(),
  N8N_SHARED_SECRET: z.string().optional().default(""),
  N8N_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  // LLM provider config for real AI agent execution (optional; falls back to demo responses).
  // Supported: Gemini (Google), OpenAI-compatible, Claude, Groq, Ollama.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  OPENAI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_BASE_URL: optionalUrl(),
  CLAUDE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

// Comma-separated CORS origins -> array, e.g. "http://localhost:5173,https://aihub.app"
export const corsOrigins: string[] = env.CORS_ORIGIN.split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
