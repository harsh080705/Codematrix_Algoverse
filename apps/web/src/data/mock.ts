import { SAMPLE_AGENTS, type AgentSummary } from "@aihub/shared";

export const mockAgents: AgentSummary[] = SAMPLE_AGENTS.map((agent, index) => ({
  id: String(index + 1),
  slug: agent.slug,
  name: agent.name,
  category: agent.category,
  description: agent.description,
  tags: [agent.category, "algorand", "x402"],
  averageRating: 4.6 - index * 0.03,
  reviewCount: 18 + index * 7,
  totalRuns: 120 + index * 46,
  pricing: {
    currency: "USDC",
    amount: agent.price,
    commissionRate: 0.1,
    developerShare: 0.9,
    marketplaceShare: 0.1,
  },
  ownerName: index % 2 === 0 ? "Nova Labs" : "ArcForge",
  ownerId: `dev-${index + 1}`,
  status: index < 8 ? "approved" : "pending",
  featured: index < 4,
  trending: index < 6,
  createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
  updatedAt: new Date().toISOString(),
}));

export const categories = ["all", "career"];

export const revenueSeries = [
  { month: "Jan", revenue: 1800, transactions: 740 },
  { month: "Feb", revenue: 2400, transactions: 910 },
  { month: "Mar", revenue: 3000, transactions: 1210 },
  { month: "Apr", revenue: 3900, transactions: 1540 },
  { month: "May", revenue: 4600, transactions: 1810 },
  { month: "Jun", revenue: 5200, transactions: 2090 },
];
