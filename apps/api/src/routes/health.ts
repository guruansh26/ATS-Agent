import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => ({
    name: "ats-ai-agent-api",
    status: "ok",
    docs: "https://github.com/your-org/ats-ai-agent#readme"
  }));

  app.get("/healthz", async () => ({ status: "ok" }));

  app.get("/readyz", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch (err) {
      return reply.status(503).send({
        status: "not_ready",
        reason: (err as Error).message
      });
    }
  });
}
