import type { ExtractedCandidate, ExtractedJob, MatchBreakdown } from "@ats/shared";

export interface LlmProvider {
  readonly name: string;
  extractResume(rawText: string): Promise<ExtractedCandidate>;
  extractJob(rawText: string): Promise<ExtractedJob>;
  /**
   * Optional refinement of the recruiter summary. Deterministic scoring stays
   * the source of truth; the LLM only enriches the prose.
   */
  refineSummary(input: {
    breakdown: MatchBreakdown;
    candidateName: string;
    jobTitle: string;
  }): Promise<string>;
}
