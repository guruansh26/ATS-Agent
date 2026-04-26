import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { loadEnv } from "../config/env.js";
import { UnauthorizedError } from "../lib/errors.js";

const PUBLIC_PATHS = new Set(["/", "/healthz", "/readyz"]);

async function plugin(app: FastifyInstance): Promise<void> {
  const env = loadEnv();

  app.addHook("onRequest", async (req: FastifyRequest, _reply: FastifyReply) => {
    if (PUBLIC_PATHS.has(req.url.split("?")[0] ?? "")) return;

    const headerKey = req.headers["x-api-key"];
    const key = Array.isArray(headerKey) ? headerKey[0] : headerKey;
    if (!key || !env.apiKeys.has(key)) {
      throw new UnauthorizedError();
    }
  });
}

export const authPlugin = fp(plugin, { name: "ats-auth" });
