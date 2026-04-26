import pino, { type Logger } from "pino";
import { loadEnv } from "./env.js";

let logger: Logger | undefined;

export function getLogger(): Logger {
  if (logger) return logger;
  const env = loadEnv();
  logger = pino({
    level: env.LOG_LEVEL,
    base: { service: "ats-worker", env: env.NODE_ENV },
    transport:
      env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined
  });
  return logger;
}
