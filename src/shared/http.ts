import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { DomainErrors, isAppError } from "@/domain/errors.js";
import { logger } from "@/shared/logger.js";
import { fail } from "@/shared/response.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        fail(res, 400, "invalid request body", error.flatten());
        return;
      }
      next(error);
    }
  };
}

export function mapDomainError(res: Response, error: unknown): Response {
  if (isAppError(error)) {
    return fail(res, error.status, error.message);
  }
  logger.error({ err: error }, "unhandled error");
  return fail(res, 500, DomainErrors.internal().message);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  mapDomainError(res, err);
}
