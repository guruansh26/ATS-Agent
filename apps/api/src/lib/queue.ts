import { Queue, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { loadEnv } from "../config/env.js";
import { QueueError } from "./errors.js";

export const SCREENING_QUEUE_NAME = "screenings";

export interface ScreeningJobPayload {
  screeningId: string;
}

let connection: Redis | undefined;
let queue: Queue<ScreeningJobPayload> | undefined;
let events: QueueEvents | undefined;

function getConnection(): Redis {
  if (connection) return connection;
  const env = loadEnv();
  const conn = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });
  conn.on("error", (err: Error) => {
    if (process.env.NODE_ENV !== "test") {
      console.error("[redis] connection error:", err.message);
    }
  });
  connection = conn;
  return conn;
}

export function getScreeningQueue(): Queue<ScreeningJobPayload> {
  if (queue) return queue;
  queue = new Queue<ScreeningJobPayload>(SCREENING_QUEUE_NAME, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 1000, age: 60 * 60 * 24 },
      removeOnFail: { count: 1000, age: 60 * 60 * 24 * 7 }
    }
  });
  return queue;
}

export function getScreeningQueueEvents(): QueueEvents {
  if (events) return events;
  events = new QueueEvents(SCREENING_QUEUE_NAME, { connection: getConnection() });
  return events;
}

export async function enqueueScreening(screeningId: string): Promise<void> {
  try {
    await getScreeningQueue().add(
      "screen",
      { screeningId },
      { jobId: `screening:${screeningId}` }
    );
  } catch (err) {
    throw new QueueError(
      `Failed to enqueue screening ${screeningId}: ${(err as Error).message}`
    );
  }
}

export async function shutdownQueue(): Promise<void> {
  await events?.close();
  await queue?.close();
  await connection?.quit();
}
