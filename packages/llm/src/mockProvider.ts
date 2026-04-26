import type { ExtractedCandidate, ExtractedJob, MatchBreakdown } from "@ats/shared";
import { uniqueSkills } from "@ats/shared";
import type { LlmProvider } from "./types.js";

const KNOWN_SKILLS = [
  "TypeScript",
  "JavaScript",
  "Node.js",
  "React",
  "Next.js",
  "Fastify",
  "Express",
  "GraphQL",
  "REST",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "BullMQ",
  "Kafka",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Terraform",
  "Python",
  "Go",
  "Java",
  "Spring",
  "Django",
  "FastAPI",
  "PyTorch",
  "TensorFlow",
  "LangChain",
  "OpenAI",
  "LLM",
  "Prisma",
  "CI/CD",
  "Linux"
];

function findSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const hits = KNOWN_SKILLS.filter((s) => lower.includes(s.toLowerCase()));
  return uniqueSkills(hits);
}

function findEmail(text: string): string | undefined {
  return text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];
}

function findPhone(text: string): string | undefined {
  return text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/)?.[0];
}

function findExperienceYears(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i);
  return m && m[1] ? Number(m[1]) : undefined;
}

function findExperienceRange(text: string): { min?: number; max?: number } {
  const range = text.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)/i);
  if (range && range[1] && range[2]) {
    return { min: Number(range[1]), max: Number(range[2]) };
  }
  const single = text.match(/(\d+)\+\s*(?:years?|yrs?)/i);
  if (single && single[1]) return { min: Number(single[1]) };
  return {};
}

function findLocation(text: string): string | undefined {
  const known = [
    "Bangalore",
    "Bengaluru",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Chennai",
    "Pune",
    "Remote",
    "London",
    "Berlin",
    "New York",
    "San Francisco",
    "Austin",
    "Tokyo",
    "Singapore"
  ];
  return known.find((loc) => new RegExp(`\\b${loc}\\b`, "i").test(text));
}

function firstLine(text: string): string {
  return text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
}

function findEducation(text: string): string[] {
  const hits = new Set<string>();
  const patterns = [
    /(B\.?Tech|Bachelor(?:'s)?(?:\s+of\s+\w+)?)[^\n.,]{0,80}/gi,
    /(M\.?Tech|MSc|Master(?:'s)?(?:\s+of\s+\w+)?|MBA)[^\n.,]{0,80}/gi,
    /(PhD|Doctorate)[^\n.,]{0,80}/gi,
    /(Diploma)[^\n.,]{0,80}/gi
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p)) hits.add(m[0].trim());
  }
  return Array.from(hits);
}

function findWorkHistory(text: string): string[] {
  const hits = new Set<string>();
  const patterns = [
    /(?:Senior |Staff |Lead |Principal )?(?:Software |Backend |Frontend |Full[- ]?stack |ML |Data |Site Reliability )?Engineer\s+at\s+[A-Z][\w&. ]+(?:\s*\(\d{4}\s*[-–]\s*(?:\d{4}|present|Present)\))?/g,
    /[A-Z][\w&. ]+\s+\(\d{4}\s*[-–]\s*(?:\d{4}|present|Present)\)/g
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p)) hits.add(m[0].trim());
  }
  return Array.from(hits).slice(0, 8);
}

/**
 * A deterministic, dependency-free LLM stand-in. Useful for:
 * - Local dev without API keys
 * - Reproducible CI tests
 * - A baseline against which a real LLM can be A/B'd.
 */
export class MockLlmProvider implements LlmProvider {
  public readonly name = "mock";

  async extractResume(rawText: string): Promise<ExtractedCandidate> {
    return {
      name: firstLine(rawText) || "Candidate",
      email: findEmail(rawText),
      phone: findPhone(rawText),
      location: findLocation(rawText),
      experienceYears: findExperienceYears(rawText),
      skills: findSkills(rawText),
      education: findEducation(rawText),
      workHistory: findWorkHistory(rawText)
    };
  }

  async extractJob(rawText: string): Promise<ExtractedJob> {
    const range = findExperienceRange(rawText);
    return {
      title: firstLine(rawText) || "Open Role",
      company: undefined,
      location: findLocation(rawText),
      experienceMin: range.min,
      experienceMax: range.max,
      skills: findSkills(rawText),
      requirements: [],
      responsibilities: []
    };
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
    const verb =
      breakdown.recommendation === "strong_match"
        ? "We recommend moving forward"
        : breakdown.recommendation === "possible_match"
        ? "Worth a screening call"
        : "Likely not a fit";
    const matched = breakdown.matchedSkills.slice(0, 4).join(", ") || "general background";
    const gap = breakdown.missingSkills.slice(0, 3).join(", ");
    const gapText = gap ? ` Gaps to probe: ${gap}.` : "";
    return `${verb}: ${candidateName} for ${jobTitle}. Strong on ${matched} (overall ${breakdown.overallScore}/100).${gapText}`;
  }
}
