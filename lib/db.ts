import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveDatabaseUrl } from "./database-url";

/** Creates a Prisma client. Swap the adapter here when moving to PostgreSQL (see README). */
export function createPrismaClient() {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: resolveDatabaseUrl() }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
