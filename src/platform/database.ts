import { PrismaClient } from "@prisma/client";
import type { Config } from "@/config/index.js";
import { logger } from "@/shared/logger.js";

export function createPrisma(cfg: Config): PrismaClient {
  const prisma = new PrismaClient({
    datasources: { db: { url: cfg.databaseUrl } },
    log: cfg.appEnv === "development" ? ["warn", "error"] : ["error"],
  });
  return prisma;
}

export async function connectDatabase(
  prisma: PrismaClient,
  cfg: Config,
): Promise<void> {
  await prisma.$connect();
  logger.info({ host: cfg.dbHost, db: cfg.dbName }, "postgres connected");
}
