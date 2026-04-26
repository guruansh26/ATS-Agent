import { createLlmProvider, type LlmProvider } from "@ats/llm";
import { loadEnv } from "../config/env.js";

let cached: LlmProvider | undefined;

export function getLlmProvider(): LlmProvider {
  if (cached) return cached;
  const env = loadEnv();
  cached = createLlmProvider({
    provider: env.LLM_PROVIDER,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL,
    openaiBaseUrl: env.OPENAI_BASE_URL
  });
  return cached;
}

export function setLlmProviderForTests(provider: LlmProvider): void {
  cached = provider;
}
