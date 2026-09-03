import { Badge, AppButton } from "./ui";

interface StructuredOutputViewProps {
  result: Record<string, unknown> | null;
  execution?: Record<string, unknown> | null;
  receipt?: Record<string, unknown> | null;
  transaction?: Record<string, unknown> | null;
  paymentState?: string;
  paymentTx?: string;
}

export function StructuredOutputView({
  result,
  execution,
  receipt,
  transaction,
  paymentState,
}: StructuredOutputViewProps) {
  if (!result && !execution) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-10 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-mint-300/30 bg-mint-300/10 text-3xl shadow-inner">
          ✨
        </div>
        <h4 className="mt-5 font-display text-lg font-bold text-white">Ready for Execution</h4>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
          Upload your input parameters or resume file above, then click &quot;Pay & run&quot; to invoke the AI agent.
        </p>
      </div>
    );
  }

  // Extract executive summary
  const summaryText =
    (typeof result?.summary === "string" && result.summary) ||
    (typeof result?.message === "string" && result.message) ||
    (typeof result?.overview === "string" && result.overview) ||
    (typeof result?.title === "string" && result.title) ||
    null;

  // Extract scores and metrics
  const metricEntries = result
    ? Object.entries(result).filter(([key, val]) => {
        if (key === "_agentMeta" || Array.isArray(val)) return false;
        if (typeof val === "number") return true;
        if (
          typeof val === "string" &&
          (/^\d+(\.\d+)?%?$/.test(val) ||
            key.toLowerCase().includes("score") ||
            key.toLowerCase().includes("rate") ||
            key.toLowerCase().includes("confidence"))
        ) {
          return true;
        }
        return false;
      })
    : [];

  // Extract arrays/lists
  const arrayEntries: Array<[string, unknown[]]> = result
    ? Object.entries(result).filter(
        (entry): entry is [string, unknown[]] => Array.isArray(entry[1]) && entry[1].length > 0 && entry[0] !== "_agentMeta",
      )
    : [];

  // Extract generic entries
  const generalEntries = result
    ? Object.entries(result).filter(([key, val]) => {
        if (key === "_agentMeta" || key === "summary" || key === "message" || key === "overview" || key === "title") return false;
        if (Array.isArray(val)) return false;
        if (metricEntries.some(([mKey]) => mKey === key)) return false;
        return true;
      })
    : [];

  // Agent Meta
  const agentMeta = result?._agentMeta as
    | { agent?: string; reasoning?: string[]; toolsUsed?: string[]; latencyMs?: number }
    | undefined;

  const executionId = typeof execution?.executionId === "string" ? execution.executionId : null;
  const txId = typeof transaction?.txId === "string" ? transaction.txId : null;

  return (
    <div className="space-y-6">
      {/* Sleek Execution Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={paymentState === "COMPLETED" ? "mint" : "gold"}>
            {paymentState === "COMPLETED" ? "✓ Execution Complete" : paymentState ?? "Processing"}
          </Badge>
          {agentMeta?.latencyMs ? (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 border border-white/5">
              ⚡ {agentMeta.latencyMs}ms runtime
            </span>
          ) : null}
          {executionId ? (
            <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-slate-400 border border-white/5">
              ID: {executionId.slice(0, 12)}...
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {receipt?.downloadUrl ? (
            <AppButton href={String(receipt.downloadUrl)} variant="secondary" className="py-1 px-3 text-xs">
              📄 Download Receipt
            </AppButton>
          ) : null}
          {txId ? (
            <AppButton
              href={`https://allo.info/tx/${txId}`}
              variant="secondary"
              target="_blank"
              rel="noreferrer"
              className="py-1 px-3 text-xs"
            >
              🔗 Algorand Explorer
            </AppButton>
          ) : null}
        </div>
      </div>

      {/* Executive Summary Card */}
      {summaryText ? (
        <div className="relative overflow-hidden rounded-3xl border border-mint-300/30 bg-gradient-to-r from-mint-300/15 via-slate-900/60 to-slate-900/80 p-6 shadow-xl backdrop-blur-xl">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-mint-300/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint-300/20 text-mint-300 text-sm">
                ✦
              </span>
              <h4 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-mint-300">
                Executive Analysis Summary
              </h4>
            </div>
            <Badge tone="mint">Verified</Badge>
          </div>
          <p className="text-base leading-7 text-white font-normal whitespace-pre-wrap">{summaryText}</p>
        </div>
      ) : null}

      {/* Visual Metric Gauges */}
      {metricEntries.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metricEntries.map(([key, val]) => {
            const numericVal = parseNumeric(val);
            return (
              <div
                key={key}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:border-mint-300/30 hover:bg-white/[0.07]"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">{formatLabel(key)}</p>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-display text-3xl font-bold text-white">{String(val)}</span>
                  {numericVal !== null ? (
                    <span className="text-xs font-semibold text-mint-300 bg-mint-300/10 px-2 py-0.5 rounded-md">
                      {numericVal >= 80 ? "Excellent" : numericVal >= 60 ? "Good" : "Needs Review"}
                    </span>
                  ) : null}
                </div>
                {/* Visual Progress Bar if numeric percentage */}
                {numericVal !== null ? (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-200 transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.max(0, numericVal))}%` }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Categorized Visual Lists */}
      <div className="grid gap-5 lg:grid-cols-2">
        {arrayEntries.map(([key, list]) => {
          const lowerKey = key.toLowerCase();
          const isPositive = lowerKey.includes("strength") || lowerKey.includes("skill") || lowerKey.includes("pass");
          const isImprovement = lowerKey.includes("improve") || lowerKey.includes("gap") || lowerKey.includes("missing");
          const isTagList = lowerKey.includes("keyword") || lowerKey.includes("tag") || lowerKey.includes("tool");

          const icon = isPositive ? "✓" : isImprovement ? "💡" : "⚡";
          const badgeTone = isPositive ? "mint" : isImprovement ? "gold" : "neutral";
          const borderClass = isPositive
            ? "border-mint-300/20 bg-mint-300/5"
            : isImprovement
            ? "border-amber-300/20 bg-amber-300/5"
            : "border-white/10 bg-white/5";

          return (
            <div key={key} className={`rounded-3xl border ${borderClass} p-6 backdrop-blur-md space-y-4`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
                    {formatLabel(key)}
                  </h4>
                </div>
                <Badge tone={badgeTone}>{list.length} Items</Badge>
              </div>

              {isTagList ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {list.map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200"
                    >
                      {formatValue(item)}
                    </span>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2.5 pt-1">
                  {list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-200">
                      <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${isPositive ? "bg-mint-300/20 text-mint-300" : isImprovement ? "bg-amber-300/20 text-amber-300" : "bg-white/10 text-white"}`}>
                        {icon}
                      </span>
                      <span className="leading-6">{formatValue(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* General Formatted Property Cards */}
      {generalEntries.length > 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h4 className="font-display text-xs uppercase tracking-[0.24em] font-semibold text-slate-400 mb-4">
            Analysis Insights & Parameters
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {generalEntries.map(([key, val]) => (
              <div key={key} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{formatLabel(key)}</p>
                <div className="mt-2 text-sm leading-6 text-white font-medium">
                  {renderFormattedContent(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Agent Reasoning Workflow Timeline */}
      {agentMeta?.reasoning && agentMeta.reasoning.length > 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h4 className="font-display text-xs uppercase tracking-[0.24em] font-semibold text-slate-400 mb-4">
            Autonomous Agent Workflow
          </h4>
          <div className="space-y-3">
            {agentMeta.reasoning.map((step, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3 text-xs">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-300/20 font-bold text-mint-300">
                  {i + 1}
                </span>
                <span className="text-slate-300 leading-5">{step}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function parseNumeric(val: unknown): number | null {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const match = val.match(/(\d+(\.\d+)?)/);
    if (match) return parseFloat(match[1]!);
  }
  return null;
}

function formatValue(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "number" || typeof item === "boolean") return String(item);
  if (typeof item === "object" && item !== null) {
    return Object.entries(item)
      .map(([k, v]) => `${formatLabel(k)}: ${v}`)
      .join(" | ");
  }
  return String(item);
}

function renderFormattedContent(val: unknown) {
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return <p className="whitespace-pre-wrap">{String(val)}</p>;
  }

  if (typeof val === "object" && val !== null) {
    return (
      <div className="space-y-1 text-xs text-slate-300">
        {Object.entries(val).map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-white/5 py-1">
            <span className="text-slate-400">{formatLabel(k)}:</span>
            <span className="font-semibold text-white">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <p>{String(val)}</p>;
}
