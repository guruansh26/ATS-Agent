import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required").default("redis://localhost:6379"),

  API_KEYS: z
    .string()
    .min(1, "API_KEYS must contain at least one comma-separated key")
    .default("dev-recruiter-key"),

  LLM_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1")
});

export type AppEnv = z.infer<typeof envSchema> & {
  apiKeys: Set<string>;
  corsOrigins: string[];
  isProd: boolean;
};

let cached: AppEnv | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  if (parsed.data.LLM_PROVIDER === "openai" && !parsed.data.OPENAI_API_KEY) {
    throw new Error(
      "LLM_PROVIDER=openai requires OPENAI_API_KEY. Set it or switch to LLM_PROVIDER=mock."
    );
  }

  cached = {
    ...parsed.data,
    apiKeys: new Set(
      parsed.data.API_KEYS.split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    ),
    corsOrigins: parsed.data.CORS_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    isProd: parsed.data.NODE_ENV === "production"
  };
  return cached;
}

export function resetEnvForTests(): void {
  cached = undefined;
}
