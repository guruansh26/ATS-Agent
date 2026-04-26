import type { FastifyInstance } from "fastify";
import { createScreeningSchema } from "@ats/shared";
import { getScreening, requestScreening } from "../services/screeningService.js";

export async function screeningsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/screenings", async (req, reply) => {
    const input = createScreeningSchema.parse(req.body);
    const screening = await requestScreening(input.jobId, input.candidateId);
    return reply.status(202).send(screening);
  });

  app.get<{ Params: { id: string } }>("/api/screenings/:id", async (req) => {
    return getScreening(req.params.id);
  });
}
