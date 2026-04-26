import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { loadEnv } from "../config/env.js";

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
  requestId: string;
}

async function plugin(app: FastifyInstance): Promise<void> {
  const env = loadEnv();

  app.setErrorHandler(
    async (err: unknown, req: FastifyRequest, reply: FastifyReply) => {
      const requestId = req.id;

      if (err instanceof ZodError) {
        req.log.warn({ err, requestId }, "validation_error");
        const body: ErrorBody = {
          error: {
            code: "validation_error",
            message: "Request body is invalid",
            details: err.flatten()
          },
          requestId
        };
        return reply.status(400).send(body);
      }

      if (err instanceof AppError) {
        req.log.warn({ err, code: err.code, requestId }, "app_error");
        const body: ErrorBody = {
          error: {
            code: err.code,
            message: err.message,
            ...(err.details ? { details: err.details } : {})
          },
          requestId
        };
        return reply.status(err.statusCode).send(body);
      }

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        req.log.warn({ err, code: err.code, requestId }, "prisma_known_error");
        if (err.code === "P2025") {
          return reply.status(404).send({
            error: { code: "not_found", message: "Resource not found" },
            requestId
          } satisfies ErrorBody);
        }
        return reply.status(409).send({
          error: { code: "database_conflict", message: "Database conflict" },
          requestId
        } satisfies ErrorBody);
      }

      const fastifyErr = err as { statusCode?: number; message?: string };
      if (fastifyErr.statusCode && fastifyErr.statusCode < 500) {
        req.log.warn({ err, requestId }, "client_error");
        return reply.status(fastifyErr.statusCode).send({
          error: {
            code: "client_error",
            message: fastifyErr.message ?? "Bad request"
          },
          requestId
        } satisfies ErrorBody);
      }

      req.log.error({ err, requestId }, "unhandled_error");
      const message = env.isProd
        ? "Internal server error"
        : (err as Error)?.message ?? "Internal server error";
      return reply.status(500).send({
        error: { code: "internal_error", message },
        requestId
      } satisfies ErrorBody);
    }
  );

  app.setNotFoundHandler(async (req, reply) => {
    return reply.status(404).send({
      error: { code: "not_found", message: `Route ${req.method} ${req.url} not found` },
      requestId: req.id
    } satisfies ErrorBody);
  });
}

export const errorHandlerPlugin = fp(plugin, { name: "ats-error-handler" });
