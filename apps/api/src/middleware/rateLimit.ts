import type { Context, Next } from "hono";
import { failure } from "../lib/response";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimitMiddleware(limit = 200, windowMs = 60_000) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const key = c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? "anonymous";
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (current.count >= limit) {
      return c.json(failure("Too many requests"), 429);
    }

    current.count += 1;
    await next();
  };
}
