import type { ApiEnvelope } from "@aihub/shared";

export function success<T>(message: string, data: T, meta?: Record<string, unknown>): ApiEnvelope<T> {
  return {
    success: true,
    message,
    data,
    meta,
  };
}

export function failure(message: string, data: Record<string, unknown> = {}): ApiEnvelope<Record<string, unknown>> {
  return {
    success: false,
    message,
    data,
  };
}
