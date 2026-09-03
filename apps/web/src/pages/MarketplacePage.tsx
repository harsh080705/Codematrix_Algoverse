import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AgentCard, AppButton, Badge, SectionHeading } from "../components/ui";
import { apiFetch } from "../lib/api";
import { mockAgents, categories as fallbackCategories } from "../data/mock";

interface AgentListItem {
  _id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  averageRating: number;
  totalRuns: number;
  featured: boolean;
  trending: boolean;
  status: string;
  tags: string[];
}

interface AgentListResponse {
  items: AgentListItem[];
}

const fallbackAgents = mockAgents;

export function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: liveAgents = [] } = useQuery({
    queryKey: ["agents", "approved"],
    queryFn: async () => {
      try {
        const result = await apiFetch<AgentListResponse>("/agents?status=approved&limit=100&page=1");
        return (result.items ?? []).filter(item => item.status === "approved" || !item.status);
      } catch {
        return fallbackAgents.map(agent => ({
          _id: agent.id,
          slug: agent.slug,
          name: agent.name,
          category: agent.category,
          description: agent.description,
          price: agent.pricing.amount,
          averageRating: agent.averageRating,
          totalRuns: agent.totalRuns,
          featured: agent.featured,
          trending: agent.trending,
          status: agent.status,
          tags: agent.tags,
        }));
      }
    },
  });

  const agents = useMemo(
    () =>
      liveAgents.map(agent => ({
        id: agent._id,
        slug: agent.slug,
        name: agent.name,
        category: agent.category,
        description: agent.description,
        tags: agent.tags ?? [agent.category, "algorand", "x402"],
        averageRating: agent.averageRating,
        reviewCount: 0,
        totalRuns: agent.totalRuns,
        pricing: {
          currency: "USDC" as const,
          amount: agent.price,
          commissionRate: 0.1,
          developerShare: 0.9,
          marketplaceShare: 0.1,
        },
        ownerName: "AIHub Developer",
        ownerId: agent._id,
        status: agent.status === "approved" ? "approved" : "pending",
        featured: agent.featured,
        trending: agent.trending,
        createdAt: "",
        updatedAt: "",
      })),
    [liveAgents],
  );

  const filtered = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = `${agent.name} ${agent.description} ${agent.category}`.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || agent.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [agents, search, category]);

  const allCategories = ["all", ...new Set([...fallbackCategories.filter(item => item !== "all"), ...agents.map(agent => agent.category)])];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Marketplace"
        title="Browse AI agents"
        description="Search, filter, inspect pricing, and open an agent detail view before invoking it through x402."
      />

      <div className="section-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search agents, categories, tags..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCategories.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === item ? "bg-mint-300 text-ink-950" : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
        <Badge tone="mint">{filtered.length} agents</Badge>
        <Badge>Average price: $0.03</Badge>
        <Badge>Payments in USDC ASA</Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(agent => <AgentCard key={agent.id} agent={agent} />)}
      </div>

      <div className="section-card p-6">
        <SectionHeading
          eyebrow="x402 flow"
          title="How execution works"
          description="Every paid invocation follows the same path: 402 challenge, wallet signature, retry, settlement, response, receipt."
          action={<AppButton href="/history" variant="secondary">View receipts</AppButton>}
        />
        <div className="grid gap-4 md:grid-cols-5">
          {[
            "Request endpoint",
            "402 response",
            "Client signs payment",
            "Settlement + execution",
            "Receipt stored",
          ].map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Step {index + 1}</p>
              <p className="mt-2 text-sm font-medium text-white">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
