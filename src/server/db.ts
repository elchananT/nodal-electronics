import { PrismaClient } from "@prisma/client";

// One client per process. In dev, Next hot reloads would otherwise open a new pool on every change.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
