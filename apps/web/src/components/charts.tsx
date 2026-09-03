import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function RevenueChart({ data }: { data: Array<{ month: string; revenue: number; transactions: number }> }) {
  return (
    <div className="section-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Revenue</p>
          <h3 className="font-display text-xl font-bold text-white">Marketplace growth</h3>
        </div>
        <span className="rounded-full border border-mint-300/20 bg-mint-300/10 px-3 py-1 text-xs text-mint-100">USDC</span>
      </div>
      <Line
        data={{
          labels: data.map(point => point.month),
          datasets: [
            {
              label: "Revenue",
              data: data.map(point => point.revenue),
              borderColor: "#31d4aa",
              backgroundColor: "rgba(49, 212, 170, 0.2)",
              tension: 0.35,
            },
            {
              label: "Transactions",
              data: data.map(point => point.transactions),
              borderColor: "#e39b19",
              backgroundColor: "rgba(227, 155, 25, 0.18)",
              tension: 0.35,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: "#cbd5e1",
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(255,255,255,0.05)" },
            },
            y: {
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(255,255,255,0.05)" },
            },
          },
        }}
      />
    </div>
  );
}
