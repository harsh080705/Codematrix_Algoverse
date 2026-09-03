import type { ApiEnvelope } from "@aihub/shared";
import { clearAuthSession, getAccessToken } from "./session";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});

  if (!headers.has("content-type") && !(init?.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  const accessToken = getAccessToken();
  if (accessToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers,
    ...init,
  });

  if (response.status === 401 && !path.startsWith("/auth/login")) {
    clearAuthSession();
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed (${response.status})`);
  }

  return (payload?.data as T) ?? (undefined as T);
}
