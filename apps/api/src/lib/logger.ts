import pino, { type Logger } from "pino";
import { loadEnv } from "../config/env.js";

let logger: Logger | undefined;

export function getLogger(): Logger {
  if (logger) return logger;
  const env = loadEnv();
  logger = pino({
    level: env.LOG_LEVEL,
    base: { service: "ats-api", env: env.NODE_ENV },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers['x-api-key']",
        "*.OPENAI_API_KEY"
      ],
      remove: true
    },
    transport:
      env.isProd || env.NODE_ENV === "test"
        ? undefined
        : {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:standard" }
          }
  });
  return logger;
}
