import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(4),

  LLM_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1")
});

export type WorkerEnv = z.infer<typeof schema>;

let cached: WorkerEnv | undefined;
export function loadEnv(): WorkerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid worker env:\n${issues}`);
  }
  if (parsed.data.LLM_PROVIDER === "openai" && !parsed.data.OPENAI_API_KEY) {
    throw new Error("LLM_PROVIDER=openai requires OPENAI_API_KEY");
  }
  cached = parsed.data;
  return cached;
}
