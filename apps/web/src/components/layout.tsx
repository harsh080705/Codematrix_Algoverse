import { Link, NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { AppButton, Badge } from "./ui";
import { clearAuthSession, getStoredUser, getStoredWalletAddress } from "../lib/session";
import { apiFetch } from "../lib/api";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const walletAddress = getStoredWalletAddress();
  const userRole = String(user?.role ?? "").toLowerCase();

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network failure on logout
    } finally {
      clearAuthSession();
      navigate("/auth", { replace: true });
    }
  };

  // Role-specific navigation items
  const navItems = [
    { to: "/marketplace", label: "Marketplace" },
    ...(userRole === "admin"
      ? [
          { to: "/admin", label: "Admin" },
          { to: "/developer", label: "Agent Builder" },
        ]
      : userRole === "developer"
      ? [
          { to: "/developer", label: "Agent Builder" },
        ]
      : [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/history", label: "History" },
        ]),
    { to: "/wallet", label: "Wallet" },
  ];

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 -z-10 bg-mesh-radial opacity-100" />
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/75 backdrop-blur-xl">
        <div className="section-shell flex h-20 items-center justify-between gap-6">
          <Link to={userRole === "admin" ? "/admin" : userRole === "developer" ? "/developer" : "/dashboard"} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-300 text-ink-950 shadow-lg shadow-mint-300/20">
              AI
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-white">AIHub</p>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Algorand x402 Marketplace</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link to="/profile" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition hover:border-mint-300/30">
                  <Badge tone={userRole === "admin" ? "gold" : userRole === "developer" ? "mint" : "neutral"}>
                    {user.role?.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-semibold text-white max-w-[100px] truncate">
                    {user.fullName}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-400/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AppButton href="/auth" variant="secondary">
                  Sign In
                </AppButton>
                <AppButton href="/auth?tab=register">
                  Register
                </AppButton>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="section-shell pb-20 pt-8">{children}</main>

      <footer className="border-t border-white/5 py-10 text-sm text-slate-400">
        <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>AIHub - pay-per-use AI services on Algorand.</p>
          <div className="flex gap-4">
            <Link to="/history" className="hover:text-white">History</Link>
            <Link to="/settings" className="hover:text-white">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
