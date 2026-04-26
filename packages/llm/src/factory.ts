import { MockLlmProvider } from "./mockProvider.js";
import { OpenAiLlmProvider } from "./openaiProvider.js";
import type { LlmProvider } from "./types.js";

export interface LlmProviderConfig {
  provider: "mock" | "openai";
  openaiApiKey?: string;
  openaiModel?: string;
  openaiBaseUrl?: string;
}

export function createLlmProvider(config: LlmProviderConfig): LlmProvider {
  if (config.provider === "openai") {
    if (!config.openaiApiKey) {
      throw new Error("openaiApiKey is required when provider is 'openai'");
    }
    return new OpenAiLlmProvider({
      apiKey: config.openaiApiKey,
      model: config.openaiModel ?? "gpt-4o-mini",
      baseUrl: config.openaiBaseUrl ?? "https://api.openai.com/v1"
    });
  }
  return new MockLlmProvider();
}
