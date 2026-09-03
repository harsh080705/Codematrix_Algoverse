import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppButton, Badge, SectionHeading, StatCard } from "../components/ui";
import { apiFetch } from "../lib/api";

interface AdminAgentItem {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  status: "draft" | "pending" | "approved" | "disabled";
  totalRuns?: number;
  ownerDeveloperId?: { fullName?: string; email?: string } | string;
  createdAt?: string;
}

interface AdminDeveloperItem {
  _id: string;
  fullName?: string;
  companyName?: string;
  bio?: string;
  approved?: boolean;
  email?: string;
  createdAt?: string;
  userId?: { name?: string; email?: string; role?: string; status?: string } | string;
}

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch all agents for admin moderation & management
  const { data: allAgents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ items?: AdminAgentItem[] } | AdminAgentItem[]>("/admin/agents");
        return Array.isArray(res) ? res : res.items ?? [];
      } catch {
        const res = await apiFetch<{ items: AdminAgentItem[] }>("/agents?limit=100&page=1");
        return res.items ?? [];
      }
    },
  });

  // Fetch enrolled developers
  const { data: developers = [], isLoading: isLoadingDevelopers } = useQuery({
    queryKey: ["admin-developers"],
    queryFn: async () => {
      try {
        const res = await apiFetch<AdminDeveloperItem[] | { items?: AdminDeveloperItem[] }>("/admin/developers");
        return Array.isArray(res) ? res : res.items ?? [];
      } catch {
        return [];
      }
    },
  });

  const pendingAgents = allAgents.filter((a) => a.status === "pending");
  const approvedAgents = allAgents.filter((a) => a.status === "approved" || !a.status);
  const disabledAgents = allAgents.filter((a) => a.status === "disabled");

  const handleApprove = async (agentId: string) => {
    setActionMessage("");
    setActionError("");
    setProcessingId(agentId);

    try {
      await apiFetch(`/admin/agents/${agentId}/approve`, { method: "POST" });
      setActionMessage("Agent approved! It is now LIVE on the Marketplace. 🚀");
      await queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve agent");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (agentId: string) => {
    setActionMessage("");
    setActionError("");
    setProcessingId(agentId);

    try {
      await apiFetch(`/admin/agents/${agentId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Rejected during admin moderation." }),
      });
      setActionMessage("Agent rejected and disabled.");
      await queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject agent");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    const confirmed = window.confirm(`Permanently delete "${agentName}" from the platform? This cannot be undone.`);
    if (!confirmed) return;

    setActionMessage("");
    setActionError("");
    setProcessingId(agentId);

    try {
      await apiFetch(`/admin/agents/${agentId}`, { method: "DELETE" });
      setActionMessage(`Agent "${agentName}" permanently deleted. 🗑️`);
      await queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete agent");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveDeveloper = async (devId: string) => {
    setActionMessage("");
    setActionError("");
    setProcessingId(devId);

    try {
      await apiFetch(`/admin/developers/${devId}/approve`, { method: "POST" });
      setActionMessage("Developer approved successfully! ✅");
      await queryClient.invalidateQueries({ queryKey: ["admin-developers"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve developer");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin Workspace"
        title="Platform Moderation & Developer Management"
        description="Approve/reject/delete AI agents, oversee enrolled developers, and maintain marketplace integrity."
      />

      {/* Admin Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending Agent Approvals"
          value={String(pendingAgents.length)}
          detail="Awaiting Admin Review"
          trend={pendingAgents.length > 0 ? "Action Required" : "All Clear"}
        />
        <StatCard label="Live Approved Agents" value={String(approvedAgents.length)} detail="Active on Marketplace" />
        <StatCard label="Enrolled Developers" value={String(developers.length || 1)} detail="Verified Platform Devs" />
        <StatCard label="Total Agent Services" value={String(allAgents.length)} detail="Platform Inventory" />
      </div>

      {/* Status Messages */}
      {actionMessage ? (
        <div className="rounded-2xl border border-mint-300/30 bg-mint-300/10 px-4 py-3 text-sm text-mint-100 font-medium">
          ✅ {actionMessage}
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100 font-medium">
          ❌ {actionError}
        </div>
      ) : null}

      {/* Pending Agent Moderation Queue */}
      <div className="section-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Pending Agent Approval Queue</h3>
            <p className="text-xs text-slate-400 mt-1">
              Developers submit agents for approval. Once approved, agents go live on the Marketplace and x402 payment layer.
            </p>
          </div>
          <Badge tone={pendingAgents.length > 0 ? "gold" : "mint"}>
            {pendingAgents.length} Pending
          </Badge>
        </div>

        {isLoadingAgents ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading submission queue...</p>
        ) : pendingAgents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <span className="text-2xl">✨</span>
            <p className="mt-2 text-sm font-semibold text-white">No Pending Agent Submissions</p>
            <p className="mt-1 text-xs text-slate-400">All submitted agents have been moderated.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAgents.map((ag) => (
              <div
                key={ag._id}
                className="flex flex-col gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-bold text-white">{ag.name}</span>
                    <Badge tone="gold">PENDING APPROVAL</Badge>
                    <span className="rounded-full bg-mint-300/10 px-2.5 py-0.5 text-xs font-semibold text-mint-100">
                      ${ag.price?.toFixed(2) ?? "0.02"} USDC
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{ag.description}</p>
                  <p className="text-xs text-slate-400">
                    Category: <span className="text-slate-200 uppercase font-medium">{ag.category}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={processingId === ag._id}
                    onClick={() => handleReject(ag._id)}
                    className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={processingId === ag._id}
                    onClick={() => handleDeleteAgent(ag._id, ag.name)}
                    className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-400/20 transition disabled:opacity-50"
                  >
                    🗑️ Delete
                  </button>
                  <AppButton
                    disabled={processingId === ag._id}
                    onClick={() => handleApprove(ag._id)}
                    className="py-1.5 text-xs font-bold shadow-lg shadow-mint-300/10"
                  >
                    {processingId === ag._id ? "Approving..." : "✅ Approve & Publish Live"}
                  </AppButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrolled Developers List */}
      <div className="section-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Enrolled Developers Directory</h3>
            <p className="text-xs text-slate-400 mt-1">Developers registered to create, publish, and monetize AI agents.</p>
          </div>
          <Badge tone="mint">{developers.length || 1} Enrolled</Badge>
        </div>

        {isLoadingDevelopers ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading enrolled developers...</p>
        ) : developers.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Demo Developer</p>
              <p className="text-xs text-slate-400">developer@aihub.com • AlgoVerse Studio</p>
            </div>
            <Badge tone="mint">APPROVED</Badge>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {developers.map((dev) => {
              const u = typeof dev.userId === "object" ? dev.userId : null;
              const name = dev.fullName || u?.name || "Developer Account";
              const email = dev.email || u?.email || "developer@aihub.com";
              const isApproved = dev.approved !== false;

              return (
                <div key={dev._id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div>
                    <p className="font-semibold text-white">{name}</p>
                    <p className="text-xs text-slate-400">{email} {dev.companyName ? `• ${dev.companyName}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={isApproved ? "mint" : "gold"}>
                      {isApproved ? "APPROVED" : "PENDING"}
                    </Badge>
                    {!isApproved ? (
                      <AppButton
                        disabled={processingId === dev._id}
                        onClick={() => handleApproveDeveloper(dev._id)}
                        className="py-1 px-3 text-xs"
                      >
                        Approve
                      </AppButton>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Approved Agents Inventory with Delete Action */}
      <div className="section-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Approved Marketplace Agents</h3>
            <p className="text-xs text-slate-400 mt-1">Live active services visible to marketplace users.</p>
          </div>
          <Badge tone="mint">{approvedAgents.length} Active</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {approvedAgents.map((ag) => (
            <div key={ag._id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
              <div>
                <p className="font-semibold text-white">{ag.name}</p>
                <p className="text-xs text-slate-400 line-clamp-1">{ag.description}</p>
                <span className="text-xs text-mint-100 font-bold">${ag.price?.toFixed(2) ?? "0.02"} USDC</span>
              </div>
              <div className="flex items-center gap-2">
                <AppButton href={`/marketplace/${ag._id}`} variant="secondary" className="py-1 px-3 text-xs">
                  View
                </AppButton>
                <button
                  type="button"
                  disabled={processingId === ag._id}
                  onClick={() => handleDeleteAgent(ag._id, ag.name)}
                  className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-400/20 transition disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
