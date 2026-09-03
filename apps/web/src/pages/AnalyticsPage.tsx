import { RevenueChart } from "../components/charts";
import { SectionHeading, StatCard } from "../components/ui";
import { revenueSeries } from "../data/mock";

export function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Analytics"
        title="Marketplace performance"
        description="Track revenue, usage, conversion, and trending agents across the marketplace."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Revenue" value="$12.3k" detail="This quarter" trend="+24%" />
        <StatCard label="Conversion" value="42%" detail="Browse to run" trend="+5%" />
        <StatCard label="Top category" value="Career" detail="Highest paid usage" />
        <StatCard label="Trending agents" value="6" detail="Featured in recommendations" />
      </div>

      <RevenueChart data={revenueSeries} />
    </div>
  );
}
