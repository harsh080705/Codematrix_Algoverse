import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { env } from "./config/env";

async function bootstrap() {
  const app = await createApp();
  serve({ fetch: app.fetch, port: env.PORT });
  console.log(`AIHub API listening on http://localhost:${env.PORT}`);
}

void bootstrap();
