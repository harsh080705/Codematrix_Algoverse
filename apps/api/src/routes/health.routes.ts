import { Hono } from "hono";

export function createHealthRoutes() {
  const app = new Hono();

  app.get("/health", c => {
    return c.json({ ok: true, service: "aihub-api", timestamp: new Date().toISOString() });
  });

  return app;
}
