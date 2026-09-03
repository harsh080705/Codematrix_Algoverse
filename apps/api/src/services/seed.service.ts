import { AgentModel, CategoryModel } from "../models";
import { SAMPLE_AGENTS, AGENT_CATEGORIES, COMMISSION_RATE, DEVELOPER_REVENUE_SHARE, MARKETPLACE_REVENUE_SHARE } from "@aihub/shared";

export async function seedCategories() {
  await Promise.all(
    AGENT_CATEGORIES.map((category: string) =>
      CategoryModel.updateOne(
        { slug: category },
        {
          name: category.replace(/-/g, " "),
          slug: category,
          description: `Marketplace category for ${category} agents`,
          active: true,
        },
        { upsert: true },
      ),
    ),
  );
}

export async function seedSampleAgents(developerId: string) {
  await Promise.all(
    SAMPLE_AGENTS.map((agent: (typeof SAMPLE_AGENTS)[number]) =>
      AgentModel.updateOne(
        { slug: agent.slug },
        {
          name: agent.name,
          slug: agent.slug,
          category: agent.category,
          description: agent.description,
          documentation: `# ${agent.name}\n\n${agent.description}\n\n## Pricing\n\n$${agent.price.toFixed(2)} USDC per invocation.`,
          endpoint: `https://api.aihub.marketplace/agents/${agent.slug}`,
          ownerDeveloperId: developerId,
          tags: [agent.category, "x402", "algorand"],
          price: agent.price,
          currency: "USDC",
          commissionRate: COMMISSION_RATE,
          developerShare: DEVELOPER_REVENUE_SHARE,
          marketplaceShare: MARKETPLACE_REVENUE_SHARE,
          averageRating: 4.7,
          reviewCount: 0,
          totalRuns: 0,
          favoritesCount: 0,
          featured: true,
          trending: true,
          status: "approved",
          inputSchema: {},
          outputSchema: {},
          screenshots: [],
          versions: [{ version: "1.0.0", changelog: "Initial release", endpoint: `https://api.aihub.marketplace/agents/${agent.slug}`, active: true }],
        },
        { upsert: true },
      ),
    ),
  );
}
