import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { success } from "../lib/response";
import { getDashboardStats } from "../services";
import { getPlatformAnalytics } from "../services";

export function createDashboardRoutes() {
  const app = new Hono();

  app.get("/dashboard", authMiddleware, async c => {
    const stats = await getDashboardStats();
    return c.json(success("Dashboard loaded", stats));
  });

  app.get("/analytics", authMiddleware, async c => {
    const analytics = await getPlatformAnalytics();
    return c.json(success("Analytics loaded", analytics));
  });

  return app;
}
