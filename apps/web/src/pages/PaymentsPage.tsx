import { useQuery } from "@tanstack/react-query";
import { AppButton, SectionHeading } from "../components/ui";
import { apiFetch } from "../lib/api";

interface TransactionRecord {
  _id: string;
  amount: number;
  status: string;
  txId?: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
  agentId?: { name?: string; slug?: string } | string;
}

interface ReceiptRecord {
  _id: string;
  receiptNumber: string;
  paymentTxId: string;
  downloadUrl: string;
  status: string;
  amount: number;
  createdAt: string;
}

const fallbackPayments = [
  { agent: "Resume Analyzer", amount: "$0.02", tx: "ALG-TX-91A2", status: "settled" },
];

export function PaymentsPage() {
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      try {
        return await apiFetch<TransactionRecord[]>("/transactions");
      } catch {
        return [];
      }
    },
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      try {
        return await apiFetch<ReceiptRecord[]>("/receipts");
      } catch {
        return [];
      }
    },
  });

  const rows =
    transactions.length > 0
      ? transactions.map(item => ({
          agent: typeof item.agentId === "object" && item.agentId && "name" in item.agentId ? item.agentId.name ?? "Agent" : "Agent",
          amount: `$${item.amount.toFixed(2)}`,
          tx: item.txId ?? item._id,
          status: item.status,
        }))
      : fallbackPayments;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Payments"
        title="Transactions and receipts"
        description="The payment view shows settled invocations, receipts, and Algorand transaction IDs for auditability."
        action={<AppButton href="/history" variant="secondary">History</AppButton>}
      />

      <div className="section-card overflow-hidden">
        <table className="min-w-full divide-y divide-white/5 text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-5 py-4 font-medium">Agent</th>
              <th className="px-5 py-4 font-medium">Amount</th>
              <th className="px-5 py-4 font-medium">Transaction</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(item => (
              <tr key={item.tx} className="text-slate-300">
                <td className="px-5 py-4 text-white">{item.agent}</td>
                <td className="px-5 py-4">{item.amount}</td>
                <td className="px-5 py-4 font-mono text-xs">{item.tx}</td>
                <td className="px-5 py-4">{item.status}</td>
                <td className="px-5 py-4 text-right">
                  <a href={receipts[0]?.downloadUrl ?? "/history"} className="app-button-secondary">
                    Download receipt
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
