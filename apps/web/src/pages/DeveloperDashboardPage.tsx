import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  AGENT_CATEGORIES,
  AGENT_TOOLS,
  agentBuilderCreateSchema,
  agentBuilderUpdateSchema,
  type AgentConfig,
} from "@aihub/shared";
import { AppButton, SectionHeading } from "../components/ui";
import { apiFetch } from "../lib/api";

interface DeveloperAgent {
  _id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  status: "draft" | "pending" | "approved" | "disabled";
  totalRuns: number;
  category?: string;
  tags?: string[];
  config?: AgentConfig;
}

type FormState = {
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  price45s: number;
  price5m: number;
  price15m: number;
  price30m: number;
  price1h: number;
  tags: string;
  n8nWebhookUrl: string;
  n8nWorkflowId: string;
};

const defaultTools = AGENT_TOOLS.slice(0, 2).map((name) => ({
  name,
  enabled: true,
  config: {},
}));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function createDefaultForm(): FormState {
  return {
    name: "",
    slug: "",
    category: AGENT_CATEGORIES[0] ?? "productivity",
    description: "",
    price: 0.02,
    price45s: 0.01,
    price5m: 0.02,
    price15m: 0.05,
    price30m: 0.10,
    price1h: 0.20,
    tags: "ai, workflow",
    n8nWebhookUrl: "",
    n8nWorkflowId: "",
  };
}

export function DeveloperDashboardPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const agentId = params.id;
  const isEditMode = Boolean(agentId);

  const [form, setForm] = useState<FormState>(createDefaultForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load existing agent if editing
  const { data: existingAgent } = useQuery({
    queryKey: ["agent-builder", agentId],
    enabled: Boolean(agentId),
    queryFn: async () => {
      if (!agentId) return null;
      return await apiFetch<DeveloperAgent>(`/agents/${agentId}`);
    },
  });

  useEffect(() => {
    if (existingAgent) {
      const tw = existingAgent.config?.pricing?.timeWindowPricing;
      setForm({
        name: existingAgent.name ?? "",
        slug: existingAgent.slug ?? "",
        category: existingAgent.category ?? AGENT_CATEGORIES[0] ?? "productivity",
        description: existingAgent.description ?? "",
        price: existingAgent.price ?? 0.02,
        price45s: tw?.["45s"] ?? 0.01,
        price5m: tw?.["5"] ?? 0.02,
        price15m: tw?.["15"] ?? 0.05,
        price30m: tw?.["30"] ?? 0.10,
        price1h: tw?.["60"] ?? 0.20,
        tags: (existingAgent.tags ?? []).join(", "),
        n8nWebhookUrl: existingAgent.config?.n8nWebhookUrl ?? "",
        n8nWorkflowId: existingAgent.config?.n8nWorkflowId ?? "",
      });
    } else if (!agentId) {
      setForm(createDefaultForm());
    }
  }, [existingAgent, agentId]);

  function buildPayload() {
    const trimmedName = form.name.trim();
    let finalSlug = slugify(form.slug.trim() || trimmedName);
    if (finalSlug.length < 2) {
      finalSlug = slugify(`${trimmedName}-agent`);
    }
    const trimmedDesc = form.description.trim();

    return {
      name: trimmedName,
      slug: finalSlug,
      category: form.category,
      description: trimmedDesc,
      tags: splitTags(form.tags),
      config: {
        ai: {
          provider: "gemini" as const,
          model: "gpt-4o-mini",
          temperature: 0.4,
          maxTokens: 800,
          systemPrompt: trimmedDesc || `You are an AI Agent named ${trimmedName}.`,
          instructions: "",
          responseFormat: "json" as const,
        },
        pricing: {
          currency: "USDC" as const,
          pricePerRequest: Number(form.price) || 0.02,
          timeWindowPricing: {
            "45s": Number(form.price45s) || 0.01,
            "5": Number(form.price5m) || 0.02,
            "15": Number(form.price15m) || 0.05,
            "30": Number(form.price30m) || 0.10,
            "60": Number(form.price1h) || 0.20,
          },
          freeTrial: false,
        },
        input: { text: true, pdf: false, image: false, audio: false, json: false },
        output: { markdown: false, json: true, text: true, pdf: false, image: false },
        tools: defaultTools,
        n8nWebhookUrl: form.n8nWebhookUrl.trim() || undefined,
        n8nWorkflowId: form.n8nWorkflowId.trim() || undefined,
      },
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Agent name is required.");
      return;
    }
    if (form.description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    const payload = buildPayload();
    const schema = isEditMode ? agentBuilderUpdateSchema : agentBuilderCreateSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fix validation errors.");
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && agentId) {
        await apiFetch<DeveloperAgent>(`/agents/${agentId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        // Automatically publish
        await apiFetch(`/agents/${agentId}/publish`, {
          method: "POST",
          body: JSON.stringify({ price: Number(form.price) }),
        }).catch(() => {});

        setMessage("Agent updated and submitted for Admin approval! ⏳");
        await queryClient.invalidateQueries({ queryKey: ["agent-builder", agentId] });
        await queryClient.invalidateQueries({ queryKey: ["agents"] });
      } else {
        const created = await apiFetch<DeveloperAgent>("/agents", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        // Automatically trigger publish request (queued as pending)
        if (created._id) {
          await apiFetch(`/agents/${created._id}/publish`, {
            method: "POST",
            body: JSON.stringify({ price: Number(form.price) }),
          }).catch(() => {});
        }

        setMessage("Agent submitted successfully! Your agent is PENDING ADMIN APPROVAL. Once an Admin approves it, it will go live on the Marketplace. ⏳");
        await queryClient.invalidateQueries({ queryKey: ["agents"] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading
        eyebrow="Agent Builder"
        title={isEditMode ? `Edit: ${form.name || "Agent"}` : "Add New AI Agent"}
        description="Publish a new pay-per-use AI service to the Algorand x402 marketplace (requires Admin approval)."
        action={
          <AppButton href="/marketplace" variant="secondary">
            Explore Marketplace ↗
          </AppButton>
        }
      />

      {message ? (
        <div className="rounded-2xl border border-mint-300/30 bg-mint-300/10 px-4 py-3 text-sm text-mint-100 font-medium">
          ✅ {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100 font-medium">
          ❌ {error}
        </div>
      ) : null}

      <div className="section-card p-6 shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Agent Name & Base Price */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Agent Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                    slug: slugify(e.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40"
                placeholder="e.g. College Counselor AI"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Base Single-Run Price (USDC) *
              </label>
              <input
                type="number"
                required
                min="0.00"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40"
                placeholder="0.02"
              />
            </div>
          </div>

          {/* TIME WINDOW SESSION PRICING CONFIGURATION */}
          <div className="rounded-2xl border border-mint-300/30 bg-mint-300/5 p-4.5 space-y-3">
            <div>
              <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <span>⏱️</span> Time-Bound Session Pass Pricing (USDC)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Set prices for session duration passes. Buyers get unlimited queries within their chosen duration pass.
              </p>
            </div>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  ⚡ 45 Secs Pass
                </label>
                <input
                  type="number"
                  min="0.00"
                  step="0.01"
                  value={form.price45s}
                  onChange={(e) => setForm((prev) => ({ ...prev, price45s: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-mint-300/40"
                  placeholder="0.01"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  ⚡ 5 Mins Pass
                </label>
                <input
                  type="number"
                  min="0.00"
                  step="0.01"
                  value={form.price5m}
                  onChange={(e) => setForm((prev) => ({ ...prev, price5m: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-mint-300/40"
                  placeholder="0.02"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  ⏱️ 15 Mins Pass
                </label>
                <input
                  type="number"
                  min="0.00"
                  step="0.01"
                  value={form.price15m}
                  onChange={(e) => setForm((prev) => ({ ...prev, price15m: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-mint-300/40"
                  placeholder="0.05"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  ⏳ 30 Mins Pass
                </label>
                <input
                  type="number"
                  min="0.00"
                  step="0.01"
                  value={form.price30m}
                  onChange={(e) => setForm((prev) => ({ ...prev, price30m: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-mint-300/40"
                  placeholder="0.10"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  ⌛ 1 Hour Pass
                </label>
                <input
                  type="number"
                  min="0.00"
                  step="0.01"
                  value={form.price1h}
                  onChange={(e) => setForm((prev) => ({ ...prev, price1h: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-mint-300/40"
                  placeholder="0.20"
                />
              </div>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40"
              >
                {AGENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40"
                placeholder="resume, career, ai"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40"
              placeholder="Describe what your AI agent does, what inputs it takes, and what outputs it produces..."
            />
          </div>

          {/* n8n Engine Webhook URL & Workflow ID */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <span>⚡</span> n8n AI Agent Engine Integration (Optional)
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  n8n Webhook URL
                </label>
                <input
                  type="url"
                  value={form.n8nWebhookUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, n8nWebhookUrl: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-mint-300/40"
                  placeholder="https://n8n.example.com/webhook/my-agent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  n8n Workflow ID
                </label>
                <input
                  type="text"
                  value={form.n8nWorkflowId}
                  onChange={(e) => setForm((prev) => ({ ...prev, n8nWorkflowId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-mint-300/40"
                  placeholder="e.g. WF_12345"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <AppButton type="submit" disabled={loading} className="w-full py-3 text-sm font-bold">
              {loading
                ? "Submitting..."
                : isEditMode
                ? "Update & Save Agent"
                : "🚀 Submit Agent for Approval"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
