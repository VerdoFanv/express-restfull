import "dotenv/config";
import http from "node:http";
import { loadConfig } from "@/config/index.js";
import { createApp } from "@/app.js";
import { connectDatabase, createPrisma } from "@/platform/database.js";
import { RabbitMQClient } from "@/platform/rabbitmq.js";
import { RedisClient } from "@/platform/redis.js";
import { logger } from "@/shared/logger.js";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const prisma = createPrisma(cfg);

  await connectDatabase(prisma, cfg);

  const redis = await RedisClient.connect(cfg);

  let mq: RabbitMQClient | null = null;
  try {
    mq = await RabbitMQClient.connect(cfg);
  } catch (error) {
    logger.warn({ err: error }, "rabbitmq unavailable, events will be skipped");
  }

  const app = createApp({ cfg, prisma, redis, mq });
  const server = http.createServer(app);

  server.listen(cfg.appPort, () => {
    logger.info({ addr: `:${cfg.appPort}`, env: cfg.appEnv }, "api listening");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down api");
    server.close();
    try {
      await redis.close();
    } catch (error) {
      logger.warn({ err: error }, "redis close");
    }
    if (mq) {
      try {
        await mq.close();
      } catch (error) {
        logger.warn({ err: error }, "rabbitmq close");
      }
    }
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error({ err: error }, "fatal");
  process.exit(1);
});
