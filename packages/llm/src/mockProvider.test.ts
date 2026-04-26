import { describe, expect, it } from "vitest";
import { MockLlmProvider } from "./mockProvider.js";

const provider = new MockLlmProvider();

describe("MockLlmProvider.extractResume", () => {
  it("extracts the obvious fields deterministically", async () => {
    const text = `Asha Verma
Email: asha@example.com
Phone: +91 90000 11111
Location: Bangalore
6 years of experience.
Skills: TypeScript, Node.js, PostgreSQL, Redis, AWS, Fastify
BTech Computer Science
Senior Engineer at Acme (2021-Present)`;
    const out = await provider.extractResume(text);
    expect(out.name).toBe("Asha Verma");
    expect(out.email).toBe("asha@example.com");
    expect(out.location).toBe("Bangalore");
    expect(out.experienceYears).toBe(6);
    expect(out.skills).toEqual(
      expect.arrayContaining(["TypeScript", "Node.js", "PostgreSQL", "AWS"])
    );
    expect(out.education[0]).toMatch(/BTech/);
  });

  it("is deterministic: same input -> same output", async () => {
    const text = "Daniel Cho. 5 years. Skills: Python, PyTorch, LLM, AWS.";
    const a = await provider.extractResume(text);
    const b = await provider.extractResume(text);
    expect(a).toEqual(b);
  });
});

describe("MockLlmProvider.extractJob", () => {
  it("extracts title, location, range, and skills", async () => {
    const text = `Senior Backend Engineer
We are hiring at Joveo. 5-9 years of experience required.
Bangalore. Skills: TypeScript, Node.js, PostgreSQL, Redis, AWS.`;
    const out = await provider.extractJob(text);
    expect(out.title).toBe("Senior Backend Engineer");
    expect(out.location).toBe("Bangalore");
    expect(out.experienceMin).toBe(5);
    expect(out.experienceMax).toBe(9);
    expect(out.skills).toEqual(
      expect.arrayContaining(["TypeScript", "Node.js", "PostgreSQL", "AWS"])
    );
  });
});

describe("MockLlmProvider.refineSummary", () => {
  it("returns a recruiter-friendly string referencing the score", async () => {
    const text = await provider.refineSummary({
      candidateName: "Asha",
      jobTitle: "Senior Backend Engineer",
      breakdown: {
        overallScore: 88,
        skillMatchScore: 100,
        experienceMatchScore: 100,
        locationMatchScore: 100,
        educationMatchScore: 100,
        matchedSkills: ["TypeScript", "Node.js"],
        missingSkills: [],
        strengths: [],
        risks: [],
        recruiterSummary: "",
        recommendation: "strong_match"
      }
    });
    expect(text).toMatch(/Asha/);
    expect(text).toMatch(/Senior Backend Engineer/);
    expect(text).toMatch(/88/);
  });
});
