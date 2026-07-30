import { Router } from "express";
import { z } from "zod";
import { DomainErrors } from "@/domain/errors.js";
import { auth } from "@/middleware/auth.js";
import type { ProductService } from "@/modules/product/service.js";
import { asyncHandler, mapDomainError, validateBody } from "@/shared/http.js";
import { created, fail, ok } from "@/shared/response.js";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  price: z.number(),
  stock: z.number().int().optional().default(0),
});

const updateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    stock: z.number().int().optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.description !== undefined ||
      body.price !== undefined ||
      body.stock !== undefined,
    { message: "at least one field required" },
  );

function parseId(raw: string): number {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw DomainErrors.invalid();
  }
  return id;
}

export function createProductRouter(
  service: ProductService,
  jwtSecret: string,
): Router {
  const router = Router();
  router.use(auth(jwtSecret));

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      if (!req.userId) {
        fail(res, 401, DomainErrors.unauthorized().message);
        return;
      }
      try {
        const products = await service.list(req.userId);
        ok(res, "success", products);
      } catch (error) {
        mapDomainError(res, error);
      }
    }),
  );

  router.post(
    "/",
    validateBody(createSchema),
    asyncHandler(async (req, res) => {
      if (!req.userId) {
        fail(res, 401, DomainErrors.unauthorized().message);
        return;
      }
      try {
        const product = await service.create({
          userId: req.userId,
          ...req.body,
        });
        created(res, "product created", product);
      } catch (error) {
        mapDomainError(res, error);
      }
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      try {
        const id = parseId(String(req.params.id));
        const product = await service.getById(id);
        ok(res, "success", product);
      } catch (error) {
        if (error instanceof Error && error.message === "invalid input") {
          fail(res, 400, "invalid id");
          return;
        }
        mapDomainError(res, error);
      }
    }),
  );

  router.put(
    "/:id",
    validateBody(updateSchema),
    asyncHandler(async (req, res) => {
      if (!req.userId) {
        fail(res, 401, DomainErrors.unauthorized().message);
        return;
      }
      try {
        const id = parseId(String(req.params.id));
        const product = await service.update(req.userId, id, req.body);
        ok(res, "product updated", product);
      } catch (error) {
        if (error instanceof Error && error.message === "invalid input") {
          fail(res, 400, "invalid id");
          return;
        }
        mapDomainError(res, error);
      }
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      if (!req.userId) {
        fail(res, 401, DomainErrors.unauthorized().message);
        return;
      }
      try {
        const id = parseId(String(req.params.id));
        await service.delete(req.userId, id);
        ok(res, "product deleted", null);
      } catch (error) {
        if (error instanceof Error && error.message === "invalid input") {
          fail(res, 400, "invalid id");
          return;
        }
        mapDomainError(res, error);
      }
    }),
  );

  return router;
}
