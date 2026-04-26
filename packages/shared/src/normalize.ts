/**
 * Lowercases, strips punctuation, and collapses whitespace so that
 * "Node.js", "node js", and "NodeJS" all canonicalise to "nodejs".
 *
 * This is the deterministic core of skill matching — small, pure, and
 * easy to reason about.
 */
export function canonSkill(input: string): string {
  return input
    .toLowerCase()
    .replace(/[._/\\+#&,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "");
}

const SKILL_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  node: "nodejs",
  "node js": "nodejs",
  reactjs: "react",
  postgres: "postgresql",
  pg: "postgresql",
  k8s: "kubernetes",
  gcp: "googlecloud",
  aws: "aws",
  ai: "artificialintelligence",
  ml: "machinelearning",
  nlp: "naturallanguageprocessing"
};

export function normalizeSkill(input: string): string {
  const canon = canonSkill(input);
  return SKILL_ALIASES[canon] ?? canon;
}

export function uniqueSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of skills) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const key = normalizeSkill(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}
