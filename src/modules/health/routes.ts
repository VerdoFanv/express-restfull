import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { asyncHandler } from "@/shared/http.js";
import { fail, ok } from "@/shared/response.js";

export function createHealthRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get(
    "/health",
    asyncHandler(async (_req, res) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        ok(res, "ok", { status: "healthy" });
      } catch {
        fail(res, 503, "database unavailable");
      }
    }),
  );

  return router;
}
