import { PrismaClient } from "@prisma/client";

import { normalizePrismaDatabaseUrl } from "@/lib/database-url";

const normalizedDatabaseUrl = normalizePrismaDatabaseUrl(process.env.DATABASE_URL);
if (normalizedDatabaseUrl) process.env.DATABASE_URL = normalizedDatabaseUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
