import type { Context, Next } from "hono";
import { ZodError } from "zod";
import { failure } from "../lib/response";

export async function errorMiddleware(c: Context, next: Next): Promise<Response | void> {
  try {
    await next();
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json(failure("Validation failed", { issues: error.flatten() }), 400);
    }

    const message = error instanceof Error ? error.message : "Unexpected server error";
    return c.json(failure(message), 500);
  }
}
