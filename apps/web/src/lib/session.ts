import type { AuthTokens, UserRole } from "@aihub/shared";

const ACCESS_TOKEN_KEY = "aihub.accessToken";
const REFRESH_TOKEN_KEY = "aihub.refreshToken";
const USER_KEY = "aihub.user";
const WALLET_KEY = "aihub.walletAddress";
const PERA_NETWORK_KEY = "aihub.peraNetwork";

export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
}

function safeGet(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

export function getAccessToken() {
  return safeGet(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return safeGet(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  const value = safeGet(USER_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as StoredUser;
  } catch {
    return null;
  }
}

export function getStoredWalletAddress(): string {
  const user = getStoredUser();
  const userWallet = user?.walletAddress ?? "";
  const storedWallet = safeGet(WALLET_KEY) ?? "";
  return userWallet || storedWallet;
}

export function getStoredPeraNetwork(): "testnet" | "mainnet" {
  return safeGet(PERA_NETWORK_KEY) === "mainnet" ? "mainnet" : "testnet";
}

export function setAuthSession(tokens: AuthTokens, user: StoredUser): void {
  safeSet(ACCESS_TOKEN_KEY, tokens.accessToken);
  safeSet(REFRESH_TOKEN_KEY, tokens.refreshToken);
  safeSet(USER_KEY, JSON.stringify(user));

  if (user.walletAddress) {
    safeSet(WALLET_KEY, user.walletAddress);
  } else {
    safeRemove(WALLET_KEY);
  }
}

export function setStoredWalletAddress(walletAddress: string): void {
  if (!walletAddress) {
    safeRemove(WALLET_KEY);
    return;
  }

  safeSet(WALLET_KEY, walletAddress);

  // Update in stored user object as well if user is signed in
  const user = getStoredUser();
  if (user) {
    user.walletAddress = walletAddress;
    safeSet(USER_KEY, JSON.stringify(user));
  }
}

export function setStoredPeraNetwork(network: "testnet" | "mainnet"): void {
  safeSet(PERA_NETWORK_KEY, network);
}

export function clearAuthSession(): void {
  safeRemove(ACCESS_TOKEN_KEY);
  safeRemove(REFRESH_TOKEN_KEY);
  safeRemove(USER_KEY);
  safeRemove(WALLET_KEY);
}

export function clearWalletSession(): void {
  safeRemove(WALLET_KEY);
  safeRemove(PERA_NETWORK_KEY);
}
