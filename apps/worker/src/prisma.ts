import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __atsWorkerPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__atsWorkerPrisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalThis.__atsWorkerPrisma = prisma;
}
