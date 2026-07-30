import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import type { Config } from "@/config/index.js";
import { logger } from "@/shared/logger.js";

export type RabbitEvent = {
  type: string;
  payload: unknown;
  createdAt: string;
};

export class RabbitMQClient {
  private constructor(
    private readonly conn: ChannelModel,
    private readonly channel: Channel,
    private readonly exchange: string,
    private readonly queue: string,
  ) {}

  static async connect(cfg: Config): Promise<RabbitMQClient> {
    const conn = await amqp.connect(cfg.rabbitUrl);
    const channel = await conn.createChannel();
    const client = new RabbitMQClient(
      conn,
      channel,
      cfg.rabbitExchange,
      cfg.rabbitQueue,
    );
    await client.setup();
    logger.info(
      { exchange: cfg.rabbitExchange, queue: cfg.rabbitQueue },
      "rabbitmq connected",
    );
    return client;
  }

  private async setup(): Promise<void> {
    await this.channel.assertExchange(this.exchange, "topic", { durable: true });
    await this.channel.assertQueue(this.queue, { durable: true });
    await this.channel.bindQueue(this.queue, this.exchange, "product.#");
  }

  async publish(routingKey: string, event: Omit<RabbitEvent, "createdAt"> & { createdAt?: string }): Promise<void> {
    const body: RabbitEvent = {
      type: event.type,
      payload: event.payload,
      createdAt: event.createdAt ?? new Date().toISOString(),
    };

    this.channel.publish(
      this.exchange,
      routingKey,
      Buffer.from(JSON.stringify(body)),
      {
        contentType: "application/json",
        persistent: true,
        timestamp: Date.now(),
      },
    );
  }

  async consume(
    queue: string | undefined,
    onMessage: (msg: ConsumeMessage) => Promise<void>,
  ): Promise<void> {
    const q = queue && queue.length > 0 ? queue : this.queue;
    await this.channel.consume(
      q,
      (msg) => {
        if (!msg) return;
        void onMessage(msg)
          .then(() => this.channel.ack(msg))
          .catch(async (err) => {
            logger.error({ err }, "consumer handler failed");
            this.channel.nack(msg, false, false);
          });
      },
      { noAck: false },
    );
  }

  async close(): Promise<void> {
    await this.channel.close();
    await this.conn.close();
  }
}
