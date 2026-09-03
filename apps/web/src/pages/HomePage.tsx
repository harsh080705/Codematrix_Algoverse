import { useQuery } from "@tanstack/react-query";
import { Badge, AppButton, AgentCard, SectionHeading } from "../components/ui";
import { apiFetch } from "../lib/api";
import { mockAgents } from "../data/mock";

interface AgentSummary {
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

interface AgentsResponse {
  items: AgentSummary[];
}

export function HomePage() {
  const { data: featured = mockAgents.filter(agent => agent.featured).slice(0, 4) } = useQuery({
    queryKey: ["home-featured-agents"],
    queryFn: async () => {
      try {
        const result = await apiFetch<AgentsResponse>("/agents?limit=4&page=1&sort=trending&featured=true");
        return (result.items ?? []).map(agent => ({
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
        }));
      } catch {
        return mockAgents.filter(agent => agent.featured).slice(0, 4);
      }
    },
  });

  return (
    <div className="space-y-16">
      {/* ── Hero ── */}
      <section className="relative pt-4 pb-2 text-center">
        {/* Decorative glow blobs */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[340px] w-[600px] rounded-full bg-mint-300/10 blur-[120px]" />
        <div className="pointer-events-none absolute -top-10 left-1/3 h-[200px] w-[300px] rounded-full bg-gold-300/8 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl space-y-6">
          <Badge tone="mint">Algorand x402 Marketplace</Badge>

          <h1 className="font-display text-4xl font-bold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
            Pay only when
            <span className="bg-gradient-to-r from-mint-300 to-gold-300 bg-clip-text text-transparent"> AI delivers</span>
          </h1>

          <p className="mx-auto max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            A decentralized marketplace for AI agents. Every execution settles in
            USDC on Algorand. Developers keep 90%. Users pay per use — no subscriptions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <AppButton href="/marketplace">Browse Agents</AppButton>
            <AppButton href="/developer" variant="secondary">Publish as Developer</AppButton>
          </div>
        </div>
      </section>

      {/* ── How It Works — 3 steps ── */}
      <section>
        <SectionHeading
          eyebrow="How it works"
          title="From click to on-chain receipt"
        />

        <div className="grid gap-5 sm:grid-cols-3">
          {([
            {
              step: "01",
              icon: "🛒",
              title: "Choose an Agent",
              desc: "Browse the marketplace and pick any AI agent — text summarizer, resume analyzer, content writer, and more.",
            },
            {
              step: "02",
              icon: "💳",
              title: "Pay & Run",
              desc: "The server returns an HTTP 402 challenge. Your wallet signs USDC on Algorand. The agent executes instantly.",
            },
            {
              step: "03",
              icon: "📄",
              title: "Get Your Receipt",
              desc: "Every execution is settled on-chain. You receive a verifiable Algorand TX ID and a downloadable receipt.",
            },
          ] as const).map(item => (
            <div
              key={item.step}
              className="section-card group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-mint-300/20"
            >
              {/* Step number watermark */}
              <span className="pointer-events-none absolute -right-2 -top-4 font-display text-[5rem] font-bold leading-none text-white/[0.03]">
                {item.step}
              </span>

              <div className="relative space-y-3">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Agents ── */}
      <section>
        <SectionHeading
          eyebrow="Trending now"
          title="Featured AI agents"
          description="Each agent is backed by x402 payment control and Algorand settlement."
          action={<AppButton href="/marketplace" variant="secondary">View all</AppButton>}
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featured.map(agent => <AgentCard key={agent.id} agent={agent} />)}
        </div>
      </section>
    </div>
  );
}
