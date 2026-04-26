import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __atsPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__atsPrisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalThis.__atsPrisma = prisma;
}
