import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { inMemoryPrisma } from "../test/inMemoryPrisma.js";

const enqueueMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../lib/prisma.js", () => ({ prisma: inMemoryPrisma }));
vi.mock("../lib/queue.js", () => ({
  enqueueScreening: enqueueMock,
  shutdownQueue: vi.fn().mockResolvedValue(undefined)
}));

const { buildApp } = await import("../app.js");
const { performScreening } = await import("../services/screeningService.js");
let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  inMemoryPrisma.reset();
  enqueueMock.mockClear();
});

const headers = { "x-api-key": "test-key", "content-type": "application/json" };

async function seedJobAndCandidate() {
  const jobRes = await app.inject({
    method: "POST",
    url: "/api/jobs",
    headers,
    payload: {
      title: "Senior Backend Engineer",
      location: "Bangalore",
      experienceMin: 5,
      experienceMax: 9,
      skills: ["TypeScript", "Node.js", "PostgreSQL"]
    }
  });
  const candRes = await app.inject({
    method: "POST",
    url: "/api/candidates",
    headers,
    payload: {
      name: "Asha Verma",
      location: "Bangalore",
      experienceYears: 6,
      skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis"],
      education: ["BTech Computer Science"]
    }
  });
  return { jobId: jobRes.json().id, candidateId: candRes.json().id };
}

describe("POST /api/screenings", () => {
  it("enqueues a screening and returns 202", async () => {
    const { jobId, candidateId } = await seedJobAndCandidate();
    const res = await app.inject({
      method: "POST",
      url: "/api/screenings",
      headers,
      payload: { jobId, candidateId }
    });
    expect(res.statusCode).toBe(202);
    expect(res.json().status).toBe("pending");
    expect(enqueueMock).toHaveBeenCalledWith(res.json().id);
  });

  it("returns 404 when job or candidate does not exist", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/screenings",
      headers,
      payload: { jobId: "missing", candidateId: "missing" }
    });
    expect(res.statusCode).toBe(404);
  });

  it("end-to-end: performScreening produces a strong match for an aligned candidate", async () => {
    const { jobId, candidateId } = await seedJobAndCandidate();
    const enqueued = await app.inject({
      method: "POST",
      url: "/api/screenings",
      headers,
      payload: { jobId, candidateId }
    });
    const screeningId = enqueued.json().id;

    const breakdown = await performScreening(screeningId);
    expect(breakdown.recommendation).toBe("strong_match");
    expect(breakdown.overallScore).toBeGreaterThanOrEqual(80);

    const fetched = await app.inject({
      method: "GET",
      url: `/api/screenings/${screeningId}`,
      headers
    });
    const body = fetched.json();
    expect(body.status).toBe("completed");
    expect(body.recommendation).toBe("strong_match");
    expect(body.matchedSkills).toEqual(
      expect.arrayContaining(["TypeScript", "Node.js", "PostgreSQL"])
    );
  });
});
