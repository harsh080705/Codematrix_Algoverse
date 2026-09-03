import type { Context, Next } from "hono";
import type { UserRole } from "@aihub/shared";
import { failure } from "../lib/response";

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const auth = c.get("auth") as { userId?: string } | undefined;
  if (!auth?.userId) {
    return c.json(failure("Unauthorized"), 401);
  }
  await next();
}

export function requireRole(...roles: (UserRole | string)[]) {
  const normalizedAllowed = roles.map(r => String(r).toLowerCase());

  return async (c: Context, next: Next): Promise<Response | void> => {
    const auth = c.get("auth") as { role?: string; userId?: string } | undefined;
    if (!auth?.userId) {
      return c.json(failure("Unauthorized"), 401);
    }

    const userRole = String(auth.role ?? "").toLowerCase();
    if (!userRole || !normalizedAllowed.includes(userRole)) {
      return c.json(failure("Forbidden: insufficient permissions for role"), 403);
    }

    await next();
  };
}
