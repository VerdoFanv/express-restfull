import { Router } from "express";
import { z } from "zod";
import { DomainErrors } from "@/domain/errors.js";
import { auth } from "@/middleware/auth.js";
import type { AuthService } from "@/modules/auth/service.js";
import { asyncHandler, mapDomainError, validateBody } from "@/shared/http.js";
import { created, fail, ok } from "@/shared/response.js";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export function createAuthRouter(
  service: AuthService,
  jwtSecret: string,
): Router {
  const router = Router();

  router.post(
    "/register",
    validateBody(registerSchema),
    asyncHandler(async (req, res) => {
      try {
        const result = await service.register(req.body);
        created(res, "registered", result);
      } catch (error) {
        mapDomainError(res, error);
      }
    }),
  );

  router.post(
    "/login",
    validateBody(loginSchema),
    asyncHandler(async (req, res) => {
      try {
        const result = await service.login(req.body);
        ok(res, "login success", result);
      } catch (error) {
        mapDomainError(res, error);
      }
    }),
  );

  router.post(
    "/refresh-token",
    validateBody(refreshSchema),
    asyncHandler(async (req, res) => {
      try {
        const tokens = await service.refresh(req.body.refreshToken);
        ok(res, "token refreshed", tokens);
      } catch (error) {
        mapDomainError(res, error);
      }
    }),
  );

  router.get(
    "/me",
    auth(jwtSecret),
    asyncHandler(async (req, res) => {
      if (!req.userId) {
        fail(res, 401, DomainErrors.unauthorized().message);
        return;
      }
      try {
        const user = await service.me(req.userId);
        ok(res, "success", user);
      } catch (error) {
        mapDomainError(res, error);
      }
    }),
  );

  return router;
}
