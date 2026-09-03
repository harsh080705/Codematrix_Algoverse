import type { Context, Next } from "hono";
import { verifyAccessToken } from "../lib/jwt";
import { failure } from "../lib/response";
import { UserModel } from "../models";
import { env } from "../config/env";

export interface AuthContext {
  userId: string;
  role: string;
  email: string;
  walletAddress?: string;
}

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authorization = c.req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return c.json(failure("Missing bearer token"), 401);
  }

  try {
    const token = authorization.slice(7);
    const claims = verifyAccessToken(token);
    const user = env.DEMO_MODE ? null : await UserModel.findById(claims.sub).lean();

    c.set("auth", {
      userId: claims.sub,
      role: claims.role,
      email: claims.email,
      walletAddress: user?.walletAddress ?? claims.walletAddress,
    } satisfies AuthContext);
    await next();
  } catch {
    return c.json(failure("Invalid or expired token"), 401);
  }
}
