import { useQuery } from "@tanstack/react-query";
import { AppButton, Badge, SectionHeading } from "../components/ui";
import { apiFetch } from "../lib/api";

interface X402StatusResponse {
  enabled: boolean;
  demoMode: boolean;
  network: string;
}

export function SettingsPage() {
  const { data: x402Status, refetch, isFetching } = useQuery({
    queryKey: ["x402-status"],
    queryFn: async () => apiFetch<X402StatusResponse>("/x402/status"),
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Settings"
        title="Platform preferences"
        description="Configure theme, network defaults, notifications, API access, and x402 payment visibility."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="section-card p-6">
          <h3 className="font-display text-xl font-bold text-white">Theme</h3>
          <p className="mt-2 text-sm text-slate-400">Dark mode is the default and is optimized for long marketplace sessions.</p>
          <div className="mt-4 flex gap-3"><AppButton>Dark mode</AppButton><AppButton variant="secondary">System</AppButton></div>
        </div>
        <div className="section-card p-6">
          <h3 className="font-display text-xl font-bold text-white">Network</h3>
          <p className="mt-2 text-sm text-slate-400">Use Algorand testnet during development and mainnet for production deployments.</p>
          <div className="mt-4 flex gap-3"><AppButton>Testnet</AppButton><AppButton variant="secondary">Mainnet</AppButton></div>
        </div>
      </div>

      <div className="section-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">x402 payment status</h3>
            <p className="mt-2 text-sm text-slate-400">This panel reflects the live backend payment configuration, so you can confirm the flow is actually enabled.</p>
          </div>
          <AppButton
            variant="secondary"
            onClick={() => {
              void refetch();
            }}
            className={isFetching ? "opacity-70" : ""}
          >
            {isFetching ? "Refreshing..." : "Refresh status"}
          </AppButton>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Badge tone={x402Status?.enabled ? "mint" : "gold"}>{x402Status?.enabled ? "x402 enabled" : "x402 disabled"}</Badge>
          <Badge tone={x402Status?.demoMode ? "gold" : "mint"}>{x402Status?.demoMode ? "Demo mode" : "Live mode"}</Badge>
          <Badge>{x402Status?.network ?? "Loading network..."}</Badge>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Enabled</p>
            <p className="mt-2 text-lg font-semibold text-white">{x402Status ? String(x402Status.enabled) : "Loading..."}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Demo mode</p>
            <p className="mt-2 text-lg font-semibold text-white">{x402Status ? String(x402Status.demoMode) : "Loading..."}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Network</p>
            <p className="mt-2 break-all text-lg font-semibold text-white">{x402Status?.network ?? "Loading..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
