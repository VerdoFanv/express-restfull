import { Redis } from "ioredis";
import type { Config } from "@/config/index.js";
import { logger } from "@/shared/logger.js";

export class RedisClient {
  constructor(private readonly rdb: Redis) {}

  static async connect(cfg: Config): Promise<RedisClient> {
    const [host, portRaw] = cfg.redisAddr.split(":");
    const port = Number.parseInt(portRaw ?? "6379", 10);

    const rdb = new Redis({
      host,
      port,
      password: cfg.redisPassword || undefined,
      db: cfg.redisDb,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    await rdb.connect();
    const pong = await rdb.ping();
    if (pong !== "PONG") {
      throw new Error(`unexpected redis ping response: ${pong}`);
    }
    logger.info({ addr: cfg.redisAddr }, "redis connected");
    return new RedisClient(rdb);
  }

  async get(key: string): Promise<string | null> {
    return this.rdb.get(key);
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    await this.rdb.set(key, value, "PX", ttlMs);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.rdb.del(...keys);
  }

  async close(): Promise<void> {
    await this.rdb.quit();
  }
}
