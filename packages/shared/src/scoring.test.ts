import { describe, expect, it } from "vitest";
import {
  computeMatch,
  recommendationFor,
  scoreEducation,
  scoreExperience,
  scoreLocation,
  scoreSkills
} from "./scoring.js";

describe("scoreSkills", () => {
  it("returns 100 when no skills are required", () => {
    const r = scoreSkills([], ["typescript"]);
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
  });

  it("matches across aliases (TS == TypeScript, Node.js == nodejs)", () => {
    const r = scoreSkills(
      ["TypeScript", "Node.js", "PostgreSQL"],
      ["TS", "node js", "Postgres"]
    );
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
    expect(r.matched).toHaveLength(3);
  });

  it("identifies missing skills", () => {
    const r = scoreSkills(
      ["React", "GraphQL", "Kubernetes"],
      ["React", "REST"]
    );
    expect(r.matched).toEqual(["React"]);
    expect(r.missing).toEqual(["GraphQL", "Kubernetes"]);
    expect(r.score).toBeCloseTo(33.3, 0);
  });
});

describe("scoreExperience", () => {
  it("returns 100 when within range", () => {
    expect(scoreExperience(5, 3, 7)).toBe(100);
  });
  it("penalises being under by 25/year", () => {
    expect(scoreExperience(2, 5, 8)).toBe(25);
  });
  it("penalises being over by 8/year (softer)", () => {
    expect(scoreExperience(12, 5, 8)).toBe(68);
  });
  it("returns 50 when candidate experience is unknown", () => {
    expect(scoreExperience(null, 3, 7)).toBe(50);
  });
});

describe("scoreLocation", () => {
  it("rewards remote on either side", () => {
    expect(scoreLocation("Bangalore", "Remote")).toBe(100);
    expect(scoreLocation("Remote, US", "Austin, TX")).toBe(100);
  });
  it("returns 100 on exact match", () => {
    expect(scoreLocation("Bangalore", "Bangalore")).toBe(100);
  });
  it("rewards token overlap", () => {
    expect(scoreLocation("Bangalore, India", "Mumbai, India")).toBe(80);
  });
  it("penalises mismatched cities", () => {
    expect(scoreLocation("Berlin", "Tokyo")).toBe(40);
  });
});

describe("scoreEducation", () => {
  it("returns reasonable defaults when nothing parseable", () => {
    expect(scoreEducation([])).toBe(60);
  });
  it("returns 100 if candidate meets or exceeds level", () => {
    expect(scoreEducation(["MSc Computer Science"], "Bachelor's degree")).toBe(100);
  });
  it("penalises gap when below requirement", () => {
    expect(scoreEducation(["Diploma in IT"], "Master's degree")).toBe(50);
  });
});

describe("recommendationFor", () => {
  it("buckets thresholds correctly", () => {
    expect(recommendationFor(85)).toBe("strong_match");
    expect(recommendationFor(65)).toBe("possible_match");
    expect(recommendationFor(40)).toBe("weak_match");
  });
});

describe("computeMatch", () => {
  it("produces a strong match for an aligned candidate", () => {
    const result = computeMatch(
      {
        title: "Senior Backend Engineer",
        location: "Bangalore",
        experienceMin: 4,
        experienceMax: 8,
        skills: ["TypeScript", "Node.js", "PostgreSQL", "AWS"],
        requirements: ["Build APIs"],
        educationLevel: "Bachelor's"
      },
      {
        name: "Asha",
        location: "Bangalore",
        experienceYears: 6,
        skills: ["TypeScript", "Node.js", "PostgreSQL", "AWS", "Redis"],
        education: ["BTech Computer Science"],
        workHistory: ["Senior Engineer at Acme", "Engineer at Globex"]
      }
    );
    expect(result.recommendation).toBe("strong_match");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.missingSkills).toEqual([]);
    expect(result.recruiterSummary).toContain("Asha");
    expect(result.recruiterSummary).toContain("Senior Backend Engineer");
  });

  it("produces a weak match when skills and experience are off", () => {
    const result = computeMatch(
      {
        title: "Staff ML Engineer",
        location: "Berlin",
        experienceMin: 7,
        experienceMax: 12,
        skills: ["PyTorch", "Distributed Systems", "Kubernetes"],
        requirements: [],
        educationLevel: "Master's"
      },
      {
        name: "Junior Dev",
        location: "Tokyo",
        experienceYears: 1,
        skills: ["HTML", "CSS"],
        education: ["Diploma in IT"],
        workHistory: []
      }
    );
    expect(result.recommendation).toBe("weak_match");
    expect(result.overallScore).toBeLessThan(60);
    expect(result.missingSkills.length).toBeGreaterThan(0);
    expect(result.risks.join(" ")).toMatch(/Missing/);
  });
});
