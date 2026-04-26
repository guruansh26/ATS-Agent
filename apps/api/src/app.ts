import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { loadEnv } from "./config/env.js";
import { getLogger } from "./lib/logger.js";
import { authPlugin } from "./plugins/auth.js";
import { errorHandlerPlugin } from "./plugins/errorHandler.js";
import { jobsRoutes } from "./routes/jobs.js";
import { candidatesRoutes } from "./routes/candidates.js";
import { screeningsRoutes } from "./routes/screenings.js";
import { healthRoutes } from "./routes/health.js";

export async function buildApp() {
  const env = loadEnv();
  const logger = getLogger();

  const app = Fastify({
    logger: logger,
    genReqId: () =>
      `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    disableRequestLogging: env.NODE_ENV === "test"
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.corsOrigins.length === 1 && env.corsOrigins[0] === "*" ? true : env.corsOrigins,
    credentials: true
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    allowList: (req) => req.url === "/healthz" || req.url === "/readyz"
  });

  await app.register(errorHandlerPlugin);
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(jobsRoutes);
  await app.register(candidatesRoutes);
  await app.register(screeningsRoutes);

  return app;
}
