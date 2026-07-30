import "dotenv/config";
import ms from "ms";

function env(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.length > 0 ? value : fallback;
}

function envInt(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envDurationMs(key: string, fallback: string): number {
  const raw = env(key, fallback);
  const parsed = ms(raw as ms.StringValue);
  if (typeof parsed !== "number") {
    const fallbackMs = ms(fallback as ms.StringValue);
    return typeof fallbackMs === "number" ? fallbackMs : 0;
  }
  return parsed;
}

export type Config = {
  appEnv: string;
  appPort: number;
  apiKey: string;
  logLevel: string;
  databaseUrl: string;
  dbHost: string;
  dbPort: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  redisAddr: string;
  redisPassword: string;
  redisDb: number;
  rabbitUrl: string;
  rabbitExchange: string;
  rabbitQueue: string;
  jwtSecret: string;
  jwtAccessTtlMs: number;
  jwtRefreshTtlMs: number;
  bcryptCost: number;
  productCacheTtlMs: number;
};

export function loadConfig(): Config {
  const dbHost = env("DB_HOST", "localhost");
  const dbPort = env("DB_PORT", "5432");
  const dbUser = env("DB_USER", "postgres");
  const dbPassword = env("DB_PASSWORD", "postgres");
  const dbName = env("DB_NAME", "express_restfull");
  const dbSslMode = env("DB_SSLMODE", "disable");

  const databaseUrl =
    process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0
      ? process.env.DATABASE_URL
      : `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public&sslmode=${dbSslMode}`;

  return {
    appEnv: env("APP_ENV", "development"),
    appPort: envInt("APP_PORT", 8080),
    apiKey: env("API_KEY", "dev-api-key"),
    logLevel: env("LOG_LEVEL", "info"),
    databaseUrl,
    dbHost,
    dbPort,
    dbUser,
    dbPassword,
    dbName,
    redisAddr: env("REDIS_ADDR", "localhost:6379"),
    redisPassword: env("REDIS_PASSWORD", ""),
    redisDb: envInt("REDIS_DB", 0),
    rabbitUrl: env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
    rabbitExchange: env("RABBITMQ_EXCHANGE", "express_restfull.events"),
    rabbitQueue: env("RABBITMQ_QUEUE", "express_restfull.product.created"),
    jwtSecret: env("JWT_SECRET", "dev-secret-change-me"),
    jwtAccessTtlMs: envDurationMs("JWT_ACCESS_TTL", "15m"),
    jwtRefreshTtlMs: envDurationMs("JWT_REFRESH_TTL", "168h"),
    bcryptCost: envInt("BCRYPT_COST", 10),
    productCacheTtlMs: envDurationMs("PRODUCT_CACHE_TTL", "5m"),
  };
}
