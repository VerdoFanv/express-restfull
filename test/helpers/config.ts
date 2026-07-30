import type { Config } from "@/config/index.js";

export function testConfig(overrides: Partial<Config> = {}): Config {
  return {
    appEnv: "test",
    appPort: 8080,
    apiKey: "dev-api-key",
    logLevel: "silent",
    databaseUrl: "postgresql://postgres:postgres@localhost:5432/test",
    dbHost: "localhost",
    dbPort: "5432",
    dbUser: "postgres",
    dbPassword: "postgres",
    dbName: "test",
    redisAddr: "localhost:6379",
    redisPassword: "",
    redisDb: 0,
    rabbitUrl: "amqp://guest:guest@localhost:5672/",
    rabbitExchange: "test.events",
    rabbitQueue: "test.product.created",
    jwtSecret: "test-secret",
    jwtAccessTtlMs: 15 * 60 * 1000,
    jwtRefreshTtlMs: 7 * 24 * 60 * 60 * 1000,
    bcryptCost: 4,
    productCacheTtlMs: 5 * 60 * 1000,
    ...overrides,
  };
}
