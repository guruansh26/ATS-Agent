import {
  JD_EXTRACTION_PROMPT,
  MATCH_EXPLANATION_PROMPT,
  RESUME_EXTRACTION_PROMPT,
  type ExtractedCandidate,
  type ExtractedJob,
  type MatchBreakdown
} from "@ats/shared";
import { ProviderError } from "./errors.js";
import type { LlmProvider } from "./types.js";

interface OpenAiOptions {
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Minimal OpenAI-compatible chat completion client. We avoid the official SDK so
 * this also works against Azure OpenAI, OpenRouter, Together, vLLM, Ollama-OpenAI,
 * etc., and so the project has no required heavyweight runtime dependency.
 */
export class OpenAiLlmProvider implements LlmProvider {
  public readonly name = "openai";
  private readonly opts: OpenAiOptions;

  constructor(opts: OpenAiOptions) {
    this.opts = opts;
  }

  private async chat(messages: ChatMessage[], expectJson = false): Promise<string> {
    const url = `${this.opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body: Record<string, unknown> = {
      model: this.opts.model,
      temperature: 0.2,
      messages
    };
    if (expectJson) body.response_format = { type: "json_object" };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.opts.apiKey}`
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new ProviderError("LLM request failed", { cause: String(err) });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(`LLM returned ${res.status}`, { body: text.slice(0, 500) });
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError("LLM returned empty content");
    return content;
  }

  private parseJson<T>(content: string): T {
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new ProviderError("LLM returned invalid JSON", { sample: cleaned.slice(0, 300) });
    }
  }

  async extractResume(rawText: string): Promise<ExtractedCandidate> {
    const content = await this.chat(
      [
        { role: "system", content: RESUME_EXTRACTION_PROMPT },
        { role: "user", content: rawText.slice(0, 16000) }
      ],
      true
    );
    return this.parseJson<ExtractedCandidate>(content);
  }

  async extractJob(rawText: string): Promise<ExtractedJob> {
    const content = await this.chat(
      [
        { role: "system", content: JD_EXTRACTION_PROMPT },
        { role: "user", content: rawText.slice(0, 16000) }
      ],
      true
    );
    return this.parseJson<ExtractedJob>(content);
  }

  async refineSummary({
    breakdown,
    candidateName,
    jobTitle
  }: {
    breakdown: MatchBreakdown;
    candidateName: string;
    jobTitle: string;
  }): Promise<string> {
    const userPayload = JSON.stringify(
      { candidateName, jobTitle, breakdown },
      null,
      2
    );
    return this.chat([
      { role: "system", content: MATCH_EXPLANATION_PROMPT },
      { role: "user", content: userPayload }
    ]);
  }
}
