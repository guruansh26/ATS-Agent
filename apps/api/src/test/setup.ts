process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
process.env.API_KEYS = process.env.API_KEYS ?? "test-key";
process.env.LLM_PROVIDER = "mock";
process.env.LOG_LEVEL = "silent";
