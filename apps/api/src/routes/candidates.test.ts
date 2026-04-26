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

describe("POST /api/candidates", () => {
  it("creates a candidate from structured input", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/candidates",
      headers,
      payload: {
        name: "Asha Verma",
        email: "asha@example.com",
        location: "Bangalore",
        experienceYears: 6,
        skills: ["TypeScript", "Node.js"]
      }
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("Asha Verma");
  });

  it("infers structured fields from raw resume text via mock provider", async () => {
    const rawText = `Daniel Cho
Email: daniel@example.com
Location: Remote
5 years of experience.
Skills: Python, PyTorch, LLM, AWS, Docker
Senior ML Engineer at NeuralCo (2022-Present)`;
    const res = await app.inject({
      method: "POST",
      url: "/api/candidates",
      headers,
      payload: { name: "", rawText }
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe("Daniel Cho");
    expect(body.email).toBe("daniel@example.com");
    expect(body.skills).toEqual(expect.arrayContaining(["Python", "AWS"]));
    expect(body.experienceYears).toBe(5);
  });

  it("rejects bad email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/candidates",
      headers,
      payload: { name: "Bad", email: "not-an-email" }
    });
    expect(res.statusCode).toBe(400);
  });
});
