import { useQuery } from "@tanstack/react-query";
import { AppButton, Badge, SectionHeading, StatCard } from "../components/ui";
import { getStoredUser, getStoredWalletAddress } from "../lib/session";
import { apiFetch } from "../lib/api";

interface UserTransaction {
  _id: string;
  amount: number;
  status: string;
  txId?: string;
  createdAt: string;
  agentId?: { name?: string } | string;
}

export function UserDashboardPage() {
  const user = getStoredUser();
  const walletAddress = getStoredWalletAddress();

  const { data: transactions = [] } = useQuery({
    queryKey: ["user-dashboard-transactions"],
    queryFn: async () => {
      try {
        return await apiFetch<UserTransaction[]>("/transactions");
      } catch {
        return [];
      }
    },
  });

  const totalSpent = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="User Workspace"
        title={`Welcome, ${user?.fullName ?? "Member"}`}
        description="Browse marketplace agents, execute AI tasks with Algorand x402 payments, and track usage history."
        action={
          <div className="flex gap-3">
            <AppButton href="/marketplace" variant="primary">
              Explore Agents
            </AppButton>
            <AppButton href="/wallet" variant="secondary">
              Wallet Settings
            </AppButton>
          </div>
        }
      />

      {/* User Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Role" value={user?.role?.toUpperCase() ?? "USER"} detail="Verified Account Role" />
        <StatCard label="Invocations" value={String(transactions.length)} detail="Paid agent runs" />
        <StatCard label="Total Spent" value={`$${totalSpent.toFixed(2)} USDC`} detail="x402 micro-payments" />
        <StatCard
          label="Wallet Status"
          value={walletAddress ? "Connected" : "Disconnected"}
          detail={walletAddress ? `${walletAddress.slice(0, 10)}...` : "Pera Wallet"}
        />
      </div>

      {/* Account Info Card */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="section-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-display text-lg font-bold text-white">Account Details</h3>
            <Badge tone="mint">Active Member</Badge>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Full Name</span>
              <span className="font-medium text-white">{user?.fullName ?? "-"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Email Address</span>
              <span className="font-medium text-white">{user?.email ?? "-"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Pera Wallet</span>
              <span className="font-mono text-xs text-mint-100">{walletAddress || "Not connected"}</span>
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <AppButton href="/profile" variant="secondary" className="py-2 text-xs">
              Edit Profile
            </AppButton>
            <AppButton href="/history" variant="secondary" className="py-2 text-xs">
              View History
            </AppButton>
          </div>
        </div>

        {/* Quick Start Card */}
        <div className="section-card p-6 space-y-4 border-mint-300/20 bg-gradient-to-br from-mint-300/10 via-slate-900/40 to-slate-900/60">
          <div className="flex items-center gap-2 text-mint-300">
            <span className="text-xl">🚀</span>
            <h3 className="font-display text-lg font-bold text-white">Quick Actions</h3>
          </div>
          <p className="text-sm text-slate-300">
            Select an AI agent from the marketplace to run resume analysis, career coaching, code audits, or market intelligence tasks guarded by x402.
          </p>
          <div className="space-y-2 pt-2">
            <AppButton href="/marketplace" className="w-full justify-center">
              Browse AI Marketplace ↗
            </AppButton>
            <AppButton href="/payments" variant="secondary" className="w-full justify-center">
              Payment & Receipt History
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
