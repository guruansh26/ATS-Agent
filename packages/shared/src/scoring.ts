import type { MatchBreakdown, Recommendation } from "./types.js";
import { normalizeSkill } from "./normalize.js";

export interface ScoringJob {
  title: string;
  location?: string | null;
  experienceMin?: number | null;
  experienceMax?: number | null;
  skills: string[];
  requirements: string[];
  educationLevel?: string | null;
}

export interface ScoringCandidate {
  name: string;
  location?: string | null;
  experienceYears?: number | null;
  skills: string[];
  education: string[];
  workHistory: string[];
}

const WEIGHTS = {
  skill: 0.5,
  experience: 0.25,
  location: 0.1,
  education: 0.15
} as const;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function scoreSkills(
  jobSkills: string[],
  candidateSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  if (jobSkills.length === 0) {
    return { score: 100, matched: [], missing: [] };
  }
  const candidateSet = new Set(candidateSkills.map(normalizeSkill));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of jobSkills) {
    if (candidateSet.has(normalizeSkill(skill))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }
  const score = clamp((matched.length / jobSkills.length) * 100);
  return { score: round(score), matched, missing };
}

export function scoreExperience(
  candidateYears: number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
): number {
  if (candidateYears == null) return 50;
  const lo = min ?? 0;
  const hi = max ?? Math.max(lo, candidateYears);

  if (candidateYears >= lo && candidateYears <= hi) return 100;

  if (candidateYears < lo) {
    const gap = lo - candidateYears;
    return round(clamp(100 - gap * 25));
  }
  const overshoot = candidateYears - hi;
  return round(clamp(100 - overshoot * 8));
}

export function scoreLocation(
  jobLocation: string | null | undefined,
  candidateLocation: string | null | undefined
): number {
  if (!jobLocation || !candidateLocation) return 70;
  const j = jobLocation.toLowerCase();
  const c = candidateLocation.toLowerCase();

  if (j.includes("remote") || c.includes("remote")) return 100;
  if (j === c) return 100;

  const jTokens = j.split(/[ ,]+/).filter(Boolean);
  const cTokens = c.split(/[ ,]+/).filter(Boolean);
  const overlap = jTokens.filter((t) => cTokens.includes(t)).length;
  if (overlap >= 1) return 80;
  return 40;
}

const EDU_LEVELS: Record<string, number> = {
  phd: 4,
  doctorate: 4,
  master: 3,
  ms: 3,
  mtech: 3,
  mba: 3,
  bachelor: 2,
  bs: 2,
  btech: 2,
  be: 2,
  diploma: 1,
  highschool: 0
};

function highestEducationLevel(items: string[]): number {
  let best = -1;
  for (const item of items) {
    const lower = item.toLowerCase();
    for (const [k, v] of Object.entries(EDU_LEVELS)) {
      if (lower.includes(k)) best = Math.max(best, v);
    }
  }
  return best;
}

export function scoreEducation(
  candidateEducation: string[],
  jobEducationHint?: string | null
): number {
  const candLevel = highestEducationLevel(candidateEducation);
  if (candLevel < 0) return 60;
  if (!jobEducationHint) return Math.min(100, 60 + candLevel * 10);
  const jobLevel = highestEducationLevel([jobEducationHint]);
  if (jobLevel < 0) return Math.min(100, 60 + candLevel * 10);
  if (candLevel >= jobLevel) return 100;
  const gap = jobLevel - candLevel;
  return round(clamp(100 - gap * 25));
}

export function recommendationFor(score: number): Recommendation {
  if (score >= 80) return "strong_match";
  if (score >= 60) return "possible_match";
  return "weak_match";
}

function buildSummary(
  candidateName: string,
  jobTitle: string,
  breakdown: Omit<MatchBreakdown, "recruiterSummary" | "recommendation">,
  recommendation: Recommendation
): string {
  const verdict =
    recommendation === "strong_match"
      ? "is a strong match"
      : recommendation === "possible_match"
      ? "is a possible match"
      : "is a weak match";

  const parts: string[] = [
    `${candidateName} ${verdict} for the ${jobTitle} role (overall ${breakdown.overallScore}/100).`
  ];
  if (breakdown.matchedSkills.length) {
    parts.push(
      `Matched skills: ${breakdown.matchedSkills.slice(0, 6).join(", ")}.`
    );
  }
  if (breakdown.missingSkills.length) {
    parts.push(
      `Gaps: ${breakdown.missingSkills.slice(0, 5).join(", ")}.`
    );
  }
  parts.push(
    `Skill ${breakdown.skillMatchScore}, experience ${breakdown.experienceMatchScore}, location ${breakdown.locationMatchScore}, education ${breakdown.educationMatchScore}.`
  );
  return parts.join(" ");
}

export function computeMatch(
  job: ScoringJob,
  candidate: ScoringCandidate
): MatchBreakdown {
  const skills = scoreSkills(job.skills, candidate.skills);
  const experience = scoreExperience(
    candidate.experienceYears,
    job.experienceMin,
    job.experienceMax
  );
  const location = scoreLocation(job.location, candidate.location);
  const education = scoreEducation(candidate.education, job.educationLevel);

  const overall = round(
    clamp(
      skills.score * WEIGHTS.skill +
        experience * WEIGHTS.experience +
        location * WEIGHTS.location +
        education * WEIGHTS.education
    )
  );

  const recommendation = recommendationFor(overall);

  const strengths: string[] = [];
  if (skills.score >= 75)
    strengths.push(`Strong skill coverage (${skills.matched.length}/${job.skills.length})`);
  if (experience >= 80) strengths.push("Experience aligns with the role");
  if (location >= 80) strengths.push("Location is compatible");
  if (education >= 80) strengths.push("Education meets the bar");
  if (candidate.workHistory.length >= 2)
    strengths.push("Multiple relevant roles in work history");

  const risks: string[] = [];
  if (skills.missing.length)
    risks.push(`Missing ${skills.missing.length} required skill(s)`);
  if (experience < 60) risks.push("Experience is below the role's range");
  if (location < 60) risks.push("Location may not align");
  if (education < 60) risks.push("Education does not meet stated requirement");
  if (!strengths.length) strengths.push("Has transferable background");

  const partial: Omit<MatchBreakdown, "recruiterSummary" | "recommendation"> = {
    overallScore: overall,
    skillMatchScore: skills.score,
    experienceMatchScore: experience,
    locationMatchScore: location,
    educationMatchScore: education,
    missingSkills: skills.missing,
    matchedSkills: skills.matched,
    strengths,
    risks
  };

  return {
    ...partial,
    recommendation,
    recruiterSummary: buildSummary(candidate.name, job.title, partial, recommendation)
  };
}
