import type { FastifyInstance } from "fastify";
import { createJobSchema, listQuerySchema } from "@ats/shared";
import { createJob, getJob, listJobs } from "../services/jobService.js";
import { listScreeningsForJob } from "../services/screeningService.js";

export async function jobsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/jobs", async (req, reply) => {
    const input = createJobSchema.parse(req.body);
    const job = await createJob(input);
    return reply.status(201).send(job);
  });

  app.get("/api/jobs", async (req) => {
    const query = listQuerySchema.parse(req.query);
    const items = await listJobs(query.skip, query.take);
    return { items, count: items.length };
  });

  app.get<{ Params: { id: string } }>("/api/jobs/:id", async (req) => {
    return getJob(req.params.id);
  });

  app.get<{ Params: { id: string } }>(
    "/api/jobs/:id/screenings",
    async (req) => {
      const items = await listScreeningsForJob(req.params.id);
      return { items, count: items.length };
    }
  );
}
