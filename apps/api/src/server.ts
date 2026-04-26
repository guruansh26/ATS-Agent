import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { shutdownQueue } from "./lib/queue.js";
import { prisma } from "./lib/prisma.js";

async function main(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(
      { provider: env.LLM_PROVIDER, env: env.NODE_ENV },
      "ats_api_listening"
    );
  } catch (err) {
    app.log.error({ err }, "failed_to_start");
    process.exit(1);
  }

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, "shutting_down");
    try {
      await app.close();
      await shutdownQueue();
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

void main();
