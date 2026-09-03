import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppButton, Badge, SectionHeading, StatCard } from "../components/ui";
import { apiFetch } from "../lib/api";
import {
  connectPeraWallet,
  disconnectPeraWallet,
  getConnectedPeraAddress,
  getPeraNetwork,
  restorePeraWalletSession,
  setPeraNetwork,
} from "../lib/pera";
import { clearAuthSession, getStoredUser, setStoredWalletAddress } from "../lib/session";
import { getStoredPeraNetwork } from "../lib/session";

export function WalletPage() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  const [walletAddress, setWalletAddress] = useState("Not connected");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [network, setNetwork] = useState<"testnet" | "mainnet">(getStoredPeraNetwork());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadWallet = async () => {
      const userWallet = currentUser?.walletAddress ?? "";
      if (userWallet) {
        setWalletAddress(userWallet);
        setStatus("connected");
        setNetwork(getPeraNetwork());
        return;
      }

      const savedAddress = getConnectedPeraAddress();
      if (savedAddress && currentUser) {
        setWalletAddress(savedAddress);
        setStatus("connected");
        setNetwork(getPeraNetwork());
        return;
      }

      setWalletAddress("Not connected");
      setStatus("idle");
    };

    void loadWallet();
  }, [currentUser?.id, currentUser?.walletAddress]);

  function handleNetworkChange(next: "testnet" | "mainnet") {
    setPeraNetwork(next);
    setNetwork(next);
    setMessage(
      next === "mainnet"
        ? "Network switched to Mainnet. Ensure your wallet funds are on Mainnet."
        : "Network switched to Testnet.",
    );
  }

  async function handleConnect() {
    setStatus("connecting");
    setMessage("");
    try {
      const address = await connectPeraWallet();
      if (!address) {
        throw new Error("No wallet address returned by Pera Wallet.");
      }

      // Try syncing with backend profile, but don't fail if guest or offline
      await apiFetch("/auth/connect-wallet", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: address,
          provider: "pera",
        }),
      }).catch(() => {});

      setWalletAddress(address);
      setStoredWalletAddress(address);
      setStatus("connected");
      setMessage("Pera Wallet connected successfully! 🚀");
    } catch (error) {
      setStatus("idle");
      const errorMessage = error instanceof Error ? error.message : "Unable to connect Pera Wallet";
      setMessage(
        errorMessage.includes("CONNECT_MODAL_CLOSED")
          ? "Pera Wallet connection modal was closed."
          : errorMessage,
      );
    }
  }

  async function handleDisconnect() {
    setStatus("idle");
    setWalletAddress("Not connected");
    setStoredWalletAddress("");
    try {
      await disconnectPeraWallet();
    } catch {
      // Ignore disconnect errors
    } finally {
      setMessage("Pera Wallet disconnected.");
    }
  }

  const handleLogoutAccount = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors
    } finally {
      clearAuthSession();
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Wallet & Account"
        title="Pera Wallet & Authentication"
        description="Link your Pera Wallet address for Algorand x402 payments, micro-settlements, and identity verification."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Wallet Status"
          value={status === "connected" ? "Connected" : "Disconnected"}
          detail={status === "connected" ? "Pera Wallet active" : "No wallet linked"}
          trend={status === "connected" ? "Ready for x402" : "Connect below"}
        />
        <StatCard
          label="Algorand Network"
          value={network === "mainnet" ? "Mainnet" : "Testnet"}
          detail="Matches x402 protocol config"
        />
        <StatCard
          label="Account Status"
          value={currentUser ? currentUser.role.toUpperCase() : "Guest"}
          detail={currentUser ? currentUser.email : "Not signed in"}
        />
      </div>

      {message ? (
        <div className="rounded-2xl border border-mint-300/30 bg-mint-300/10 px-4 py-3 text-sm text-mint-100 font-medium">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Account Card */}
        <div className="section-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Platform Account</h3>
                <p className="text-xs text-slate-400 mt-0.5">Your authenticated AIHub user identity</p>
              </div>
              {currentUser ? (
                <Badge tone="mint">{currentUser.role.toUpperCase()}</Badge>
              ) : (
                <Badge tone="gold">GUEST</Badge>
              )}
            </div>

            {currentUser ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                    Full Name
                  </span>
                  <p className="text-white font-medium">{currentUser.fullName}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                    Email Address
                  </span>
                  <p className="text-white font-medium">{currentUser.email}</p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-slate-300">You are currently operating as a guest.</p>
                <AppButton href="/auth">Sign In / Register ↗</AppButton>
              </div>
            )}
          </div>

          {currentUser ? (
            <div className="pt-4 border-t border-white/10">
              <AppButton onClick={handleLogoutAccount} variant="secondary" className="w-full justify-center">
                Sign Out of Account
              </AppButton>
            </div>
          ) : null}
        </div>

        {/* Pera Wallet Card */}
        <div className="section-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white">Pera Wallet Connection</h3>
              <p className="text-xs text-slate-400 mt-0.5">Connect Pera for x402 payment signing</p>
            </div>
            {status === "connected" ? (
              <Badge tone="mint">Wallet Linked</Badge>
            ) : (
              <Badge tone="gold">Disconnected</Badge>
            )}
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-2">
              Connected Algorand Address
            </span>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-mono text-xs font-semibold text-white break-all">
              {walletAddress}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {status === "connected" ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-xs font-bold text-red-300 hover:bg-red-400/20 transition"
              >
                Disconnect Wallet
              </button>
            ) : (
              <AppButton onClick={handleConnect} disabled={status === "connecting"}>
                {status === "connecting" ? "Connecting..." : "Connect Pera Wallet"}
              </AppButton>
            )}
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Network Mode
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleNetworkChange("testnet")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  network === "testnet"
                    ? "bg-mint-300 text-ink-950 shadow-md shadow-mint-300/20"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:text-white"
                }`}
              >
                Testnet
              </button>
              <button
                type="button"
                onClick={() => handleNetworkChange("mainnet")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  network === "mainnet"
                    ? "bg-mint-300 text-ink-950 shadow-md shadow-mint-300/20"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:text-white"
                }`}
              >
                Mainnet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
