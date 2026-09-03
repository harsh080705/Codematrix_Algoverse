import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { paymentMiddlewareFromHTTPServer, x402HTTPResourceServer } from "@x402/hono";
import { connectDatabase } from "./config/database";
import { env, corsOrigins, X402_ALGORAND_TESTNET } from "./config/env";
import { settlementMiddleware } from "./middleware/settlement";
import { errorMiddleware } from "./middleware/error";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { securityHeadersMiddleware } from "./middleware/securityHeaders";
import { AgentModel } from "./models";
import {
  createAdminRoutes,
  createAgentRoutes,
  createAuthRoutes,
  createDashboardRoutes,
  createDeveloperRoutes,
  createExecutionRoutes,
  createHealthRoutes,
  createPaymentRoutes,
} from "./routes";
import { buildX402Routes } from "./x402/routes";
import { attachX402HttpServer, refreshApprovedAgentRoutes, syncX402RoutesMiddleware } from "./x402/dynamic";
import { createX402ResourceServer } from "./x402/server";

export async function createApp() {
  await connectDatabase();

  const app = new Hono();
  let x402Enabled = false;
  app.use("*", logger());
  app.use("*", errorMiddleware);
  app.use("*", securityHeadersMiddleware);
  app.use(
    "*",
    cors({
      origin: corsOrigins,
      credentials: true,
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "PAYMENT-SIGNATURE",
        "X-PAYMENT",
        "X-Requested-With",
        "Access-Control-Expose-Headers",
        "x-session-id",
        "X-Session-Id",
      ],
      exposeHeaders: [
        "PAYMENT-REQUIRED",
        "PAYMENT-RESPONSE",
        "X-PAYMENT-RESPONSE",
        "Content-Type",
        "x-session-id",
        "X-Session-Id",
      ],
    }),
  );
  app.use("/auth/*", rateLimitMiddleware(20, 60_000));
  app.use("/agents/*", rateLimitMiddleware(100, 60_000));
  app.use("*", settlementMiddleware);

  if (!env.DEMO_MODE && env.ENABLE_X402) {
    try {
      const approvedAgents = await AgentModel.find({ status: "approved" }).lean();
      const x402Routes = buildX402Routes(approvedAgents as never);
      const x402Server = createX402ResourceServer();
      await x402Server.initialize();
      const httpServer = new x402HTTPResourceServer(x402Server, x402Routes);
      attachX402HttpServer(httpServer);

      app.use("*", syncX402RoutesMiddleware);
      app.use("*", async (c, next) => {
        const sessionId = c.req.header("x-session-id");
        if (sessionId) {
          return next();
        }
        const handler = paymentMiddlewareFromHTTPServer(httpServer, {
          appName: "AIHub",
          appLogo: "/logo.svg",
          testnet: env.X402_NETWORK === X402_ALGORAND_TESTNET,
        });
        return handler(c, next);
      });

      await refreshApprovedAgentRoutes(true);
      x402Enabled = true;
    } catch (error) {
      console.warn(
        "[x402] payment middleware disabled because the configured facilitator does not support Algorand exact payments:",
        error,
      );
    }
  }

  app.get("/x402/status", c =>
    c.json({
      success: true,
      message: "x402 status",
      data: {
        enabled: x402Enabled,
        demoMode: env.DEMO_MODE,
        network: env.X402_NETWORK,
      },
    }),
  );

  app.route("/", createHealthRoutes());
  app.route("/", createAuthRoutes());
  app.route("/", createAgentRoutes());
  app.route("/", createDeveloperRoutes());
  app.route("/", createAdminRoutes());
  app.route("/", createExecutionRoutes());
  app.route("/", createPaymentRoutes());
  app.route("/", createDashboardRoutes());

  return app;
}
