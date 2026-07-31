import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import helmet from "helmet";
import type { PrismaClient } from "@prisma/client";
import type { Config } from "@/config/index.js";
import { apiKey } from "@/middleware/api-key.js";
import { createAuthRepository } from "@/modules/auth/repository.js";
import { createAuthRouter } from "@/modules/auth/routes.js";
import { AuthService } from "@/modules/auth/service.js";
import { createProductRepository } from "@/modules/product/repository.js";
import { createProductRouter } from "@/modules/product/routes.js";
import { ProductService } from "@/modules/product/service.js";
import type { RabbitMQClient } from "@/platform/rabbitmq.js";
import type { RedisClient } from "@/platform/redis.js";
import { errorHandler } from "@/shared/http.js";
import { logger } from "@/shared/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type AppDeps = {
  cfg: Config;
  prisma: PrismaClient;
  redis: RedisClient | null;
  mq: RabbitMQClient | null;
};

export function createApp(deps: AppDeps): Express {
  const { cfg, prisma, redis, mq } = deps;

  const authService = new AuthService(createAuthRepository(prisma), cfg);
  const productService = new ProductService(
    createProductRepository(prisma),
    redis,
    mq,
    cfg,
  );

  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${Date.now() - start}ms`,
      });
    });
    next();
  });

  const docsRoot = path.resolve(__dirname, "../docs");
  app.use("/docs", express.static(docsRoot));
  app.get("/docs", (_req, res) => {
    res.sendFile(path.join(docsRoot, "index.html"));
  });

  const api = express.Router();
  api.use(apiKey(cfg.apiKey));
  api.use("/authentication", createAuthRouter(authService, cfg.jwtSecret));
  api.use("/products", createProductRouter(productService, cfg.jwtSecret));

  app.use("/api/v1", api);
  app.use(errorHandler);

  return app;
}
