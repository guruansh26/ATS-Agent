import { afterEach, describe, expect, it, vi } from "vitest";

const fakeJob = {
  id: "job-1",
  title: "Senior Backend Engineer",
  location: "Bangalore",
  experienceMin: 5,
  experienceMax: 9,
  skills: ["TypeScript", "Node.js", "PostgreSQL"],
  requirements: []
};

const fakeCandidate = {
  id: "cand-1",
  name: "Asha Verma",
  location: "Bangalore",
  experienceYears: 6,
  skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis"],
  education: ["BTech Computer Science"],
  workHistory: ["Senior Engineer at Acme"]
};

let stored: Record<string, unknown> = {};
const screeningRecord: Record<string, unknown> = {
  id: "scr-1",
  jobId: fakeJob.id,
  candidateId: fakeCandidate.id,
  status: "pending",
  job: fakeJob,
  candidate: fakeCandidate
};

vi.mock("./prisma.js", () => ({
  prisma: {
    screening: {
      findUnique: vi.fn().mockResolvedValue(screeningRecord),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        stored = { ...stored, ...data };
        return stored;
      })
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({})
    }
  }
}));

const { processScreening } = await import("./processScreening.js");

afterEach(() => {
  stored = {};
});

describe("worker processScreening", () => {
  it("computes a deterministic match and persists the result", async () => {
    const result = await processScreening("scr-1");

    expect(result.recommendation).toBe("strong_match");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(["TypeScript", "Node.js", "PostgreSQL"])
    );

    expect(stored.status).toBe("completed");
    expect(stored.recommendation).toBe("strong_match");
    expect(stored.recruiterSummary).toMatch(/Asha/);
  });
});
