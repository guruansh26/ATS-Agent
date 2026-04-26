import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { loadEnv } from "./env.js";
import { getLogger } from "./logger.js";
import { prisma } from "./prisma.js";
import { processScreening } from "./processScreening.js";

export const SCREENING_QUEUE_NAME = "screenings";

export interface ScreeningJobPayload {
  screeningId: string;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const log = getLogger().child({ component: "worker" });

  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });
  connection.on("error", (err: Error) => {
    log.error({ err: err.message }, "redis_connection_error");
  });

  const worker = new Worker<ScreeningJobPayload>(
    SCREENING_QUEUE_NAME,
    async (job: Job<ScreeningJobPayload>) => {
      const { screeningId } = job.data;
      const child = log.child({
        bullJobId: job.id,
        screeningId,
        attempt: job.attemptsMade
      });
      child.info("processing_screening");
      const result = await processScreening(screeningId);
      child.info({ score: result.overallScore }, "screening_processed");
      return { ok: true, score: result.overallScore };
    },
    {
      connection,
      concurrency: env.WORKER_CONCURRENCY,
      autorun: true,
      lockDuration: 30_000
    }
  );

  worker.on("failed", (job, err) => {
    log.error(
      { jobId: job?.id, screeningId: job?.data?.screeningId, err: err?.message },
      "screening_job_failed"
    );
  });
  worker.on("error", (err) => log.error({ err: err.message }, "worker_error"));
  worker.on("ready", () => log.info("worker_ready"));

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, "shutting_down_worker");
    try {
      await worker.close();
      await connection.quit();
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

void main();
