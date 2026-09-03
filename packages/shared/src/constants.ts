export const COMMISSION_RATE = 0.1;
export const DEVELOPER_REVENUE_SHARE = 0.9;
export const MARKETPLACE_REVENUE_SHARE = 0.1;

export const ALGORAND_NETWORKS = ["algorand:mainnet", "algorand:testnet"] as const;
export const USER_ROLES = ["user", "developer", "admin"] as const;
export const AGENT_STATUSES = ["draft", "pending", "approved", "disabled"] as const;
export const TRANSACTION_STATUSES = ["initiated", "challenged", "verified", "settled", "failed"] as const;
export const RECEIPT_STATUSES = ["pending", "issued", "downloaded"] as const;

export const AI_PROVIDERS = ["openai", "gemini", "claude", "groq", "ollama"] as const;
export const AI_MODELS: Record<(typeof AI_PROVIDERS)[number], string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  gemini: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
  claude: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  ollama: ["llama3.1", "mistral", "gemma2"],
};
export const RESPONSE_FORMATS = ["text", "json"] as const;
export const INPUT_TYPES = ["text", "pdf", "image", "audio", "json"] as const;
export const OUTPUT_TYPES = ["markdown", "json", "text", "pdf", "image"] as const;

export const AGENT_TOOLS = [
  "web-search",
  "calculator",
  "pdf-reader",
  "ocr",
  "database",
  "sql",
  "file-storage",
  "image-generation",
  "email",
  "weather",
  "github",
  "google-drive",
  "calendar",
  "code-execution",
] as const;

export const AGENT_TOOL_DESCRIPTIONS: Record<string, string> = {
  "web-search": "Search the web and return relevant results and snippets.",
  calculator: "Perform arithmetic and scientific calculations.",
  "pdf-reader": "Extract and parse text from uploaded PDF documents.",
  ocr: "Extract text from images using optical character recognition.",
  database: "Query structured database records.",
  sql: "Translate natural language into runnable SQL queries.",
  "file-storage": "Store and retrieve files from the agent workspace.",
  "image-generation": "Generate images from natural language prompts.",
  email: "Compose and send emails on behalf of the user.",
  weather: "Fetch current weather and forecasts for a location.",
  github: "Read repos, issues, and pull requests from GitHub.",
  "google-drive": "Read and write files in Google Drive.",
  calendar: "Read and schedule calendar events.",
  "code-execution": "Run code in a sandboxed environment.",
};

export const AGENT_CATEGORIES = [
  "productivity",
  "research",
  "design",
  "engineering",
  "writing",
  "education",
  "finance",
  "career",
  "data",
  "customer-success",
] as const;

export const SAMPLE_AGENTS = [
  {
    slug: "resume-analyzer",
    name: "Resume Analyzer",
    category: "career",
    price: 0.02,
    description: "Scores resumes, highlights gaps, and recommends improvements.",
  },
  {
    slug: "text-summarizer",
    name: "Text Summarizer AI",
    category: "productivity",
    price: 0.02,
    description: "Instantly distills long articles, documents, and text into key bullet points and structured summaries.",
  },
] as const;
