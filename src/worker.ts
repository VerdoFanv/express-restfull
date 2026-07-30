import "dotenv/config";
import { loadConfig } from "@/config/index.js";
import { RabbitMQClient, type RabbitEvent } from "@/platform/rabbitmq.js";
import { logger } from "@/shared/logger.js";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const mq = await RabbitMQClient.connect(cfg);

  logger.info({ queue: cfg.rabbitQueue }, "worker listening");

  await mq.consume(cfg.rabbitQueue, async (msg) => {
    let event: RabbitEvent;
    try {
      event = JSON.parse(msg.content.toString()) as RabbitEvent;
    } catch (error) {
      logger.error({ err: error }, "invalid event payload");
      throw error;
    }

    logger.info(
      {
        type: event.type,
        payload: event.payload,
        createdAt: event.createdAt,
      },
      "event received",
    );
    // Side-effects: email, search sync, audit log, etc.
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "worker shutting down");
    await mq.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error({ err: error }, "fatal");
  process.exit(1);
});
