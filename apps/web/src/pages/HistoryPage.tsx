import { useQuery } from "@tanstack/react-query";
import { SectionHeading } from "../components/ui";
import { apiFetch } from "../lib/api";

interface TransactionRecord {
  _id: string;
  amount: number;
  status: string;
  txId?: string;
  createdAt: string;
  agentId?: { name?: string } | string;
}

const fallbackTransactions = [
  ["Resume Analyzer", "0.02 USDC", "settled", "ALG-TX-91A2"],
];

export function HistoryPage() {
  const { data: transactions = [] } = useQuery({
    queryKey: ["history-transactions"],
    queryFn: async () => {
      try {
        return await apiFetch<TransactionRecord[]>("/transactions");
      } catch {
        return [];
      }
    },
  });

  const rows =
    transactions.length > 0
      ? transactions.map(item => [
          typeof item.agentId === "object" && item.agentId && "name" in item.agentId ? item.agentId.name ?? "Agent" : "Agent",
          `${item.amount.toFixed(2)} USDC`,
          item.status,
          item.txId ?? "-",
        ])
      : fallbackTransactions;

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="History" title="Execution log" description="Every paid invocation is recorded with a receipt and transaction ID." />
      <div className="section-card overflow-hidden">
        <table className="min-w-full divide-y divide-white/5 text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-5 py-4 font-medium">Agent</th>
              <th className="px-5 py-4 font-medium">Amount</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Algorand TX</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(([agent, amount, status, tx]) => (
              <tr key={`${agent}-${tx}`} className="text-slate-300">
                <td className="px-5 py-4 text-white">{agent}</td>
                <td className="px-5 py-4">{amount}</td>
                <td className="px-5 py-4">{status}</td>
                <td className="px-5 py-4 font-mono text-xs">{tx}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
