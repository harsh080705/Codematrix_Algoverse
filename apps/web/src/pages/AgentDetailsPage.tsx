import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { AppButton, Badge, StatCard } from "../components/ui";
import { StructuredOutputView } from "../components/StructuredOutputView";
import { apiFetch } from "../lib/api";
import { mockAgents } from "../data/mock";
import { runPaidAgent } from "../lib/agent-run";

interface AgentDetailResponse {
  _id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  documentation: string;
  endpoint: string;
  price: number;
  currency: "USDC";
  averageRating: number;
  reviewCount: number;
  totalRuns: number;
  favoritesCount: number;
  featured: boolean;
  trending: boolean;
  status: string;
  tags: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  config?: {
    n8nWorkflowId?: string;
    pricing?: {
      pricePerRequest?: number;
      timeWindowPricing?: {
        "45s"?: number;
        "5"?: number;
        "15"?: number;
        "30"?: number;
        "60"?: number;
      };
    };
  };
  ownerDeveloperId?: {
    companyName?: string;
    bio?: string;
  };
  versions: Array<{ version: string; changelog: string; endpoint: string; active: boolean; createdAt: string }>;
  screenshots: string[];
  createdAt: string;
  updatedAt: string;
}

type PaymentState =
  | "IDLE"
  | "PAYMENT_REQUIRED"
  | "WALLET_OPEN"
  | "SIGNING"
  | "SUBMITTING"
  | "VERIFYING"
  | "PAID"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED";

type TimeWindowOption = "45s" | 5 | 15 | 30 | 60;

const fallbackAgent = mockAgents[0]!;

export function AgentDetailsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [execution, setExecution] = useState<Record<string, unknown> | null>(null);
  const [transaction, setTransaction] = useState<Record<string, unknown> | null>(null);
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [paymentTx, setPaymentTx] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("IDLE");
  const [runError, setRunError] = useState("");
  
  // Dynamic Time Window Selection ("45s", 5m, 15m, 30m, 60m)
  const [selectedDuration, setSelectedDuration] = useState<TimeWindowOption>(5);

  // Time-bound session state
  const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [activeSessionId, setActiveSessionId] = useState<string>("");

  // Payment Success Transaction ID Modal Pop-up State
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [txModalDetails, setTxModalDetails] = useState<{ txId: string; amount: number; timePass: string } | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<boolean>(false);

  const progressTimers = useRef<number[]>([]);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Countdown timer for active session
  useEffect(() => {
    if (!sessionEndTime) return;

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((sessionEndTime - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff === 0) {
        setSessionEndTime(null);
        setActiveSessionId("");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionEndTime]);

  function clearProgressTimers() {
    progressTimers.current.forEach(timer => window.clearTimeout(timer));
    progressTimers.current = [];
  }

  function startProgressAnimation() {
    clearProgressTimers();
    setPaymentState("PAYMENT_REQUIRED");
    const steps: Array<[number, PaymentState]> = [
      [250, "WALLET_OPEN"],
      [750, "SIGNING"],
      [1200, "SUBMITTING"],
      [1700, "VERIFYING"],
      [2400, "PAID"],
      [3000, "EXECUTING"],
    ];

    steps.forEach(([delay, state]) => {
      const timer = window.setTimeout(() => setPaymentState(state), delay);
      progressTimers.current.push(timer);
    });
  }

  useEffect(() => () => clearProgressTimers(), []);

  useEffect(() => {
    if (result || paymentState !== "IDLE") {
      outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [result, paymentState]);

  const { data: agent } = useQuery({
    queryKey: ["agent", params.id],
    queryFn: async () => {
      if (!params.id) {
        return null;
      }

      try {
        return await apiFetch<AgentDetailResponse>(`/agents/${params.id}`);
      } catch {
        const fallback = fallbackAgent;
        if (fallback.id === params.id) {
          return {
            _id: fallback.id,
            slug: fallback.slug,
            name: fallback.name,
            category: fallback.category,
            description: fallback.description,
            documentation: "Comprehensive AI agent documentation.",
            endpoint: `/api/v1/agents/${fallback.slug}/run`,
            price: fallback.pricing.amount,
            currency: "USDC" as const,
            averageRating: fallback.averageRating,
            reviewCount: fallback.reviewCount,
            totalRuns: fallback.totalRuns,
            favoritesCount: 12,
            featured: fallback.featured,
            trending: fallback.trending,
            status: fallback.status,
            tags: fallback.tags,
            inputSchema: {},
            outputSchema: {},
            versions: [{ version: "1.0.0", changelog: "Initial release", endpoint: `/api/v1/agents/${fallback.slug}/run`, active: true, createdAt: fallback.createdAt }],
            screenshots: [],
            createdAt: fallback.createdAt,
            updatedAt: fallback.updatedAt,
          };
        }
        return null;
      }
    },
  });

  const liveAgent = agent ?? {
    _id: params.id ?? fallbackAgent.id,
    slug: fallbackAgent.slug,
    name: fallbackAgent.name,
    category: fallbackAgent.category,
    description: fallbackAgent.description,
    documentation: "Comprehensive AI agent documentation.",
    endpoint: `/api/v1/agents/${fallbackAgent.slug}/run`,
    price: fallbackAgent.pricing.amount,
    currency: "USDC" as const,
    averageRating: fallbackAgent.averageRating,
    reviewCount: fallbackAgent.reviewCount,
    totalRuns: fallbackAgent.totalRuns,
    favoritesCount: 12,
    featured: fallbackAgent.featured,
    trending: fallbackAgent.trending,
    status: fallbackAgent.status,
    tags: fallbackAgent.tags,
    inputSchema: {},
    outputSchema: {},
    versions: [{ version: "1.0.0", changelog: "Initial release", endpoint: `/api/v1/agents/${fallbackAgent.slug}/run`, active: true, createdAt: fallbackAgent.createdAt }],
    screenshots: [],
    createdAt: fallbackAgent.createdAt,
    updatedAt: fallbackAgent.updatedAt,
  };

  const isSessionActive = sessionEndTime !== null && remainingSeconds > 0;

  // Calculate pricing for time windows
  const customPricing = liveAgent.config?.pricing?.timeWindowPricing;
  const timeWindowPrices: Record<TimeWindowOption, number> = {
    "45s": customPricing?.["45s"] ?? 0.01,
    5: customPricing?.["5"] ?? liveAgent.price ?? 0.02,
    15: customPricing?.["15"] ?? 0.05,
    30: customPricing?.["30"] ?? 0.10,
    60: customPricing?.["60"] ?? 0.20,
  };

  const currentPassPrice = timeWindowPrices[selectedDuration];

  // Formatting active session countdown timer (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine Agent UI Input Type based on Category / Slug / Name
  const categoryKey = (liveAgent.category ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const slugKey = (liveAgent.slug ?? "").toLowerCase();
  const nameKey = (liveAgent.name ?? "").toLowerCase();

  const isResumeType =
    categoryKey === "resumeanalyzer" ||
    categoryKey === "career" ||
    slugKey.includes("resume") ||
    nameKey.includes("resume");

  const isTextSummarizerType =
    categoryKey === "textsummarizer" ||
    categoryKey === "writing" ||
    categoryKey === "productivity" ||
    slugKey.includes("summariz") ||
    nameKey.includes("summariz");

  const isCodeType =
    categoryKey === "code" ||
    categoryKey === "engineering" ||
    slugKey.includes("code") ||
    slugKey.includes("sql") ||
    nameKey.includes("code");

  // Determine dynamic UI text & hints
  const fileUploadLabel = isResumeType
    ? resumeFile ? resumeFile.name : "Attach Resume"
    : isTextSummarizerType
    ? resumeFile ? resumeFile.name : "Attach Document (Optional)"
    : isCodeType
    ? resumeFile ? resumeFile.name : "Attach Code File (Optional)"
    : resumeFile ? resumeFile.name : "Attach File (Optional)";

  const fileTypeBadge = isResumeType
    ? "PDF/DOCX"
    : isTextSummarizerType
    ? "TXT/PDF"
    : isCodeType
    ? "JS/PY/SQL"
    : "ALL FILES";

  const textPlaceholder = isSessionActive
    ? `Ask a follow-up query (${selectedDuration === "45s" ? "45-Sec" : `${selectedDuration}-Min`} Active Pass)...`
    : isResumeType
    ? "Enter target job title, career goals, or analysis notes..."
    : isTextSummarizerType
    ? "Enter or paste text/article content you want summarized..."
    : isCodeType
    ? "Paste code snippet, SQL query, or technical requirement..."
    : `Enter prompt or questions for ${liveAgent.name}...`;

  const runMutation = useMutation({
    mutationFn: async () => {
      setRunError("");
      
      // If no active session, trigger x402 payment animation
      if (!isSessionActive) {
        setResult(null);
        setExecution(null);
        setTransaction(null);
        setReceipt(null);
        setPaymentTx("");
        startProgressAnimation();
      } else {
        setPaymentState("EXECUTING");
      }

      const response = await runPaidAgent(
        liveAgent._id, 
        { 
          text: inputText,
          sessionId: activeSessionId || undefined,
          durationMinutes: selectedDuration,
        }, 
        { resumeFile, skipPayment: isSessionActive }
      );
      
      await queryClient.invalidateQueries({ queryKey: ["agent", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      return response;
    },
    onSuccess: response => {
      clearProgressTimers();
      setPaymentState("COMPLETED");
      setResult(response.output);
      setExecution(response.execution ?? null);
      setTransaction(response.transaction ?? null);
      setReceipt(response.receipt ?? null);
      setPaymentTx(response.paymentResponse);

      // Trigger Transaction Pop-up Modal on initial payment success
      if (!sessionEndTime) {
        let txId = "";
        if (response.paymentResponse) {
          try {
            const parsed = JSON.parse(atob(response.paymentResponse));
            txId = parsed.transaction || parsed.txId || "";
          } catch {
            txId = response.paymentResponse;
          }
        }
        if (!txId && response.transaction) {
          txId = String((response.transaction as Record<string, unknown>).txId || (response.transaction as Record<string, unknown>)._id || "");
        }
        if (!txId) {
          txId = `TX_${Math.random().toString(36).substring(2, 11).toUpperCase()}_ALGO`;
        }

        setTxModalDetails({
          txId,
          amount: currentPassPrice,
          timePass: selectedDuration === "45s" ? "45 Seconds" : `${selectedDuration} Minutes`,
        });
        setShowTxModal(true);

        // Start active session duration pass (45s, 5m, 15m, 30m, 60m)
        const DURATION_MS = selectedDuration === "45s" ? 45 * 1000 : Number(selectedDuration) * 60 * 1000;
        setSessionEndTime(Date.now() + DURATION_MS);
        setActiveSessionId(`sess_${Date.now()}`);
      }
    },
    onError: error => {
      clearProgressTimers();
      setPaymentState("FAILED");
      setRunError(error instanceof Error ? error.message : "Failed to run agent");
    },
  });

  const isLiveAgent = useMemo(() => /^[a-f0-9]{24}$/i.test(liveAgent._id), [liveAgent._id]);
  const canRunPaid = liveAgent.status === "approved" && isLiveAgent;

  return (
    <div className="space-y-6 relative">
      {/* PAYMENT SUCCESS TRANSACTION POPUP MODAL */}
      {showTxModal && txModalDetails ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-mint-300/40 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 shadow-2xl shadow-mint-300/20 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint-300/20 text-3xl border border-mint-300/40 animate-bounce">
              ⚡
            </div>

            <div>
              <span className="inline-block rounded-full bg-mint-300/20 px-3 py-1 text-xs font-semibold text-mint-100 border border-mint-300/30 mb-2">
                ✅ Algorand x402 Payment Verified
              </span>
              <h3 className="font-display text-2xl font-bold text-white">Payment Successful!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Your <strong className="text-mint-300">{txModalDetails.timePass} Pass</strong> ($
                {txModalDetails.amount.toFixed(2)} USDC) is now active with unlimited queries.
              </p>
            </div>

            {/* Transaction Hash Container */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Algorand Transaction ID (TxID)</span>
                <span className="text-[10px] text-mint-300 font-mono">ON-CHAIN VERIFIED</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-black/50 p-2.5 border border-white/10 font-mono text-xs text-mint-100">
                <span className="truncate max-w-[320px]">{txModalDetails.txId}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(txModalDetails.txId);
                    setCopiedTxId(true);
                    setTimeout(() => setCopiedTxId(false), 2000);
                  }}
                  className="shrink-0 rounded-lg bg-mint-300/20 px-2.5 py-1 text-[11px] font-bold text-mint-300 hover:bg-mint-300/30 transition"
                >
                  {copiedTxId ? "Copied! ✓" : "Copy TxID"}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://testnet.algoexplorer.io/tx/${txModalDetails.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-slate-200 hover:bg-white/10 transition text-center"
              >
                🔗 View Explorer ↗
              </a>
              <AppButton
                onClick={() => setShowTxModal(false)}
                className="flex-1 py-3 text-xs font-bold shadow-lg shadow-mint-300/20"
              >
                🚀 Got It & Start Session
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}

      {/* Top Header & Agent Details Bar */}
      <div className="section-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{liveAgent.name}</h1>
              <Badge tone="mint">{liveAgent.category}</Badge>
              <Badge>{liveAgent.currency} ${currentPassPrice.toFixed(2)}</Badge>
              <Badge>★ {liveAgent.averageRating.toFixed(1)}</Badge>
              <Badge tone={isLiveAgent ? "mint" : "gold"}>{isLiveAgent ? "Live Agent" : "Demo Fallback"}</Badge>
              
              {/* Active Session Status Badge */}
              {isSessionActive ? (
                <Badge tone="mint">
                  ⏱️ Active Session: {formatTime(remainingSeconds)} left
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300 max-w-3xl">{liveAgent.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <StatCard label="Total Runs" value={String(liveAgent.totalRuns)} />
            <StatCard label="Rating" value={`★ ${liveAgent.averageRating.toFixed(1)}`} />
            <AppButton href="/marketplace" variant="secondary">
              Back to Marketplace
            </AppButton>
          </div>
        </div>
      </div>

      {/* TIME WINDOW DURATION SELECTOR (Shown before payment) */}
      {!isSessionActive ? (
        <div className="section-card p-5 border border-mint-300/20 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
                <span>⏱️</span> Select Session Duration Pass (Unlimited Queries)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Choose a time pass. During your active duration window, ask unlimited follow-up queries with zero extra payment requirements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {(
              [
                { duration: "45s", label: "45 Secs", icon: "⚡" },
                { duration: 5, label: "5 Mins", icon: "⚡" },
                { duration: 15, label: "15 Mins", icon: "⏱️" },
                { duration: 30, label: "30 Mins", icon: "⏳" },
                { duration: 60, label: "1 Hour", icon: "⌛" },
              ] as const
            ).map((opt) => {
              const price = timeWindowPrices[opt.duration];
              const isSelected = selectedDuration === opt.duration;
              return (
                <button
                  key={opt.duration}
                  type="button"
                  onClick={() => setSelectedDuration(opt.duration)}
                  className={`rounded-2xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-mint-300 bg-mint-300/15 text-white shadow-lg shadow-mint-300/10 ring-1 ring-mint-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{opt.icon}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-mint-300 text-ink-950" : "bg-white/10 text-slate-300"}`}>
                      ${price.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold">{opt.label} Pass</p>
                    <p className="text-[10px] text-slate-400">Unlimited questions</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ACTIVE TIME-BOUND COUNSELOR SESSION BANNER */}
      {isSessionActive ? (
        <div className="rounded-2xl border border-mint-300/40 bg-gradient-to-r from-mint-300/15 to-gold-300/10 p-4 text-center backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-300 text-ink-950 text-xl font-bold">
                ⏱️
              </span>
              <div>
                <h4 className="font-display text-base font-bold text-white">
                  Active Session ({selectedDuration === "45s" ? "45-Sec" : `${selectedDuration}-Min`} Pass)
                </h4>
                <p className="text-xs text-slate-300">
                  Ask unlimited follow-up questions & cutoff queries without paying extra x402 fees.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-extrabold text-mint-100 bg-black/40 px-3.5 py-1.5 rounded-xl border border-mint-300/30">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Execution Progress Banner */}
      {paymentState !== "IDLE" && paymentState !== "COMPLETED" && paymentState !== "FAILED" ? (
        <div className="rounded-2xl border border-mint-300/30 bg-mint-300/10 p-4 text-center backdrop-blur-md animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <p className="text-sm font-semibold text-mint-100">
                Executing AI Agent ({paymentState.replace(/_/g, " ")})
              </p>
              <p className="text-xs text-slate-400">
                {isSessionActive
                  ? `Processing query in active ${selectedDuration === "45s" ? "45-sec" : `${selectedDuration}-min`} session...`
                  : "Verifying Algorand x402 payment & running neural model..."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Output Stream Area */}
      <div className="section-card p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Execution Output Stream</p>
            <h3 className="mt-1 font-display text-xl font-bold text-white">Analysis Results</h3>
          </div>
          <Badge tone={paymentState === "COMPLETED" ? "mint" : paymentState === "FAILED" ? "gold" : "neutral"}>
            {paymentState}
          </Badge>
        </div>

        <StructuredOutputView
          result={result}
          execution={execution}
          receipt={receipt}
          transaction={transaction}
          paymentState={paymentState}
          paymentTx={paymentTx}
        />

        <div ref={outputEndRef} />
      </div>

      {/* STICKY BOTTOM INPUT DOCK */}
      <div className="sticky bottom-4 z-40 w-full rounded-3xl border border-mint-300/30 bg-slate-950/95 p-4.5 shadow-2xl shadow-black/90 backdrop-blur-2xl transition-all">
        {runError ? (
          <div className="mb-2.5 rounded-xl border border-red-400/30 bg-red-400/10 p-2.5 text-xs text-red-300">
            ❌ {runError}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Dynamic File Upload Pill */}
          <div className="relative shrink-0">
            <input
              type="file"
              accept="*/*"
              onChange={event => setResumeFile(event.target.files?.[0] ?? null)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium text-slate-200 transition hover:border-mint-300/40 hover:bg-white/10">
              <span className="text-mint-300 text-base">📁</span>
              <span className="max-w-[160px] truncate font-semibold">
                {fileUploadLabel}
              </span>
              {resumeFile ? (
                <span className="text-[10px] text-mint-300 bg-mint-300/20 px-1.5 py-0.5 rounded font-mono">
                  {Math.round(resumeFile.size / 1024)}KB
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">{fileTypeBadge}</span>
              )}
            </div>
          </div>

          {/* Dynamic Input Text / Prompt Field */}
          <div className="flex-1">
            <input
              type="text"
              value={inputText}
              onChange={event => setInputText(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-mint-300/40 focus:bg-white/[0.08] placeholder:text-slate-500"
              placeholder={textPlaceholder}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 shrink-0">
            <AppButton
              onClick={() => {
                if (!isLiveAgent) {
                  setRunError("Open a real agent from the marketplace first.");
                  return;
                }

                if (!canRunPaid) {
                  setRunError("This agent is not approved for paid runs yet.");
                  return;
                }

                if (isResumeType && !resumeFile && !inputText.trim()) {
                  setRunError("Please attach a resume file or enter notes before running.");
                  return;
                }

                if (!isResumeType && !inputText.trim() && !resumeFile) {
                  setRunError("Please enter prompt text or attach a file before running.");
                  return;
                }

                runMutation.mutate();
              }}
              className={`py-3 px-6 text-sm font-bold shadow-lg shadow-mint-300/10 ${runMutation.isPending || !canRunPaid ? "opacity-70" : ""}`}
              disabled={!canRunPaid || runMutation.isPending}
            >
              {runMutation.isPending
                ? "⚡ Executing..."
                : isSessionActive
                ? `💬 Send Query (${formatTime(remainingSeconds)})`
                : canRunPaid
                ? `🚀 Pay $${currentPassPrice.toFixed(2)} & Start ${selectedDuration === "45s" ? "45-Sec" : `${selectedDuration}-Min`} Pass`
                : "Unavailable"}
            </AppButton>
            <AppButton href="/wallet" variant="secondary" className="py-3 px-3 text-xs">
              ⚙️
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
