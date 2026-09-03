import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppButton, Badge } from "../components/ui";
import { apiFetch } from "../lib/api";
import { setAuthSession, type StoredUser } from "../lib/session";
import type { AuthTokens, UserRole } from "@aihub/shared";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
}

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("tab") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getDashboardPath(userRole: UserRole): string {
    const norm = String(userRole).toLowerCase();
    if (norm === "admin") return "/admin";
    if (norm === "developer") return "/developer";
    return "/dashboard";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!fullName.trim()) {
        setError("Full name is required.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "register") {
        await apiFetch<{ userId: string }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ fullName, email, password, role }),
        });
      }

      // Automatically log in after registration or login
      const loginRes = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const tokens: AuthTokens = {
        accessToken: loginRes.accessToken,
        refreshToken: loginRes.refreshToken,
      };

      setAuthSession(tokens, loginRes.user);
      const redirectPath = getDashboardPath(loginRes.user.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setError("");
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode("login");
    setLoading(true);

    try {
      const loginRes = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });

      const tokens: AuthTokens = {
        accessToken: loginRes.accessToken,
        refreshToken: loginRes.refreshToken,
      };

      setAuthSession(tokens, loginRes.user);
      const redirectPath = getDashboardPath(loginRes.user.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quick login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto my-8 max-w-lg space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-300 text-ink-950 font-bold text-xl shadow-lg shadow-mint-300/20">
          AI
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Access AIHub Marketplace with role-based features and Algorand x402 payments.
        </p>
      </div>

      <div className="section-card p-6 shadow-2xl backdrop-blur-xl">
        {/* Tab Selector */}
        <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-mint-300/20 text-mint-100 border border-mint-300/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              mode === "register"
                ? "bg-mint-300/20 text-mint-100 border border-mint-300/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-300 font-medium">
            ❌ {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40 focus:bg-white/[0.08]"
                placeholder="Jane Doe"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40 focus:bg-white/[0.08]"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40 focus:bg-white/[0.08]"
              placeholder="••••••••"
            />
          </div>

          {mode === "register" ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-mint-300/40 focus:bg-white/[0.08]"
                  placeholder="••••••••"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select Role
                </label>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {[
                    { key: "user", label: "USER", icon: "👤", desc: "Browse & execute AI agents with x402 payments." },
                    { key: "developer", label: "DEVELOPER", icon: "⚡", desc: "Create, publish & monetize custom AI agents." },
                    { key: "admin", label: "ADMIN", icon: "🛡️", desc: "Platform moderation & ecosystem management." },
                  ].map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key as UserRole)}
                      className={`flex flex-col items-center justify-between rounded-2xl border p-3 text-center transition ${
                        role === r.key
                          ? "border-mint-300/50 bg-mint-300/15 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span className="text-xl mb-1">{r.icon}</span>
                      <span className="text-xs font-bold uppercase">{r.label}</span>
                    </button>
                  ))}
                </div>

                {/* Role Description Box */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                  {role === "user" ? (
                    <p>
                      <span className="font-semibold text-mint-300">USER Role:</span> Discover, run, and pay for AI agent services using Algorand x402 micro-transactions.
                    </p>
                  ) : role === "developer" ? (
                    <p>
                      <span className="font-semibold text-mint-300">DEVELOPER Role:</span> Build, configure prompts/models, publish, and earn revenue from your AI agents.
                    </p>
                  ) : (
                    <p>
                      <span className="font-semibold text-amber-300">ADMIN Role:</span> Platform-wide moderation, approving developers, featuring agents, and system monitoring.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : null}

          <div className="pt-2">
            <AppButton
              type="submit"
              className="w-full justify-center py-3.5 text-sm font-bold shadow-lg shadow-mint-300/10"
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In to Marketplace" : "Create Account & Continue"}
            </AppButton>
          </div>
        </form>

        {/* Demo Mode Quick Accounts */}
        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-xs text-slate-400 mb-2 font-semibold">Quick Demo Login Accounts:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("user@aihub.market", "ChangeMe123!")}
              className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-mint-300/40"
            >
              👤 User
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("developer@aihub.market", "ChangeMe123!")}
              className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-mint-300/40"
            >
              ⚡ Developer
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@aihub.market", "ChangeMe123!")}
              className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-mint-300/40"
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
