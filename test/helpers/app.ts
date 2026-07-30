import express, { type Express } from "express";
import type { Config } from "@/config/index.js";
import { apiKey } from "@/middleware/api-key.js";
import { createAuthRouter } from "@/modules/auth/routes.js";
import type { AuthService } from "@/modules/auth/service.js";
import { createProductRouter } from "@/modules/product/routes.js";
import type { ProductService } from "@/modules/product/service.js";
import { errorHandler } from "@/shared/http.js";
import { ok } from "@/shared/response.js";

export function createTestApp(opts: {
  cfg: Config;
  authService: AuthService;
  productService: ProductService;
}): Express {
  const app = express();
  app.use(express.json());

  const api = express.Router();
  api.use(apiKey(opts.cfg.apiKey));
  api.get("/health", (_req, res) => {
    ok(res, "ok", { status: "healthy" });
  });
  api.use(
    "/authentication",
    createAuthRouter(opts.authService, opts.cfg.jwtSecret),
  );
  api.use(
    "/products",
    createProductRouter(opts.productService, opts.cfg.jwtSecret),
  );

  app.use("/api/v1", api);
  app.use(errorHandler);
  return app;
}
