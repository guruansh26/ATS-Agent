import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { inMemoryPrisma } from "../test/inMemoryPrisma.js";

vi.mock("../lib/prisma.js", () => ({ prisma: inMemoryPrisma }));
vi.mock("../lib/queue.js", () => ({
  enqueueScreening: vi.fn().mockResolvedValue(undefined),
  shutdownQueue: vi.fn().mockResolvedValue(undefined)
}));

const { buildApp } = await import("../app.js");
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
});

const headers = { "x-api-key": "test-key", "content-type": "application/json" };

describe("POST /api/jobs", () => {
  it("rejects requests without an API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/jobs",
      payload: { title: "Engineer" }
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("unauthorized");
  });

  it("creates a job and returns 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/jobs",
      headers,
      payload: {
        title: "Senior Backend Engineer",
        company: "Joveo",
        location: "Bangalore",
        experienceMin: 5,
        experienceMax: 9,
        skills: ["TypeScript", "Node.js", "PostgreSQL"],
        requirements: ["5+ years building APIs"]
      }
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.title).toBe("Senior Backend Engineer");
    expect(body.skills).toContain("TypeScript");
  });

  it("returns 400 with details for invalid bodies", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/jobs",
      headers,
      payload: { title: "x" }
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("validation_error");
  });

  it("lists and fetches jobs", async () => {
    await app.inject({
      method: "POST",
      url: "/api/jobs",
      headers,
      payload: { title: "Job One", skills: ["TypeScript"] }
    });
    const list = await app.inject({ method: "GET", url: "/api/jobs", headers });
    expect(list.statusCode).toBe(200);
    expect(list.json().count).toBe(1);

    const id = list.json().items[0].id;
    const one = await app.inject({ method: "GET", url: `/api/jobs/${id}`, headers });
    expect(one.statusCode).toBe(200);
    expect(one.json().title).toBe("Job One");
  });

  it("returns 404 for missing job ids", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/jobs/missing",
      headers
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("not_found");
  });
});
