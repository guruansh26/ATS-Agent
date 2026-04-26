import type { FastifyInstance } from "fastify";
import { createCandidateSchema, listQuerySchema } from "@ats/shared";
import {
  createCandidate,
  getCandidate,
  listCandidates
} from "../services/candidateService.js";

export async function candidatesRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/candidates", async (req, reply) => {
    const input = createCandidateSchema.parse(req.body);
    const candidate = await createCandidate(input);
    return reply.status(201).send(candidate);
  });

  app.get("/api/candidates", async (req) => {
    const query = listQuerySchema.parse(req.query);
    const items = await listCandidates(query.skip, query.take);
    return { items, count: items.length };
  });

  app.get<{ Params: { id: string } }>("/api/candidates/:id", async (req) => {
    return getCandidate(req.params.id);
  });
}
