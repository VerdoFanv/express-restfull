import type { NextFunction, Request, Response } from "express";
import { DomainErrors } from "@/domain/errors.js";
import { fail } from "@/shared/response.js";

export function apiKey(expected: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!expected) {
      next();
      return;
    }

    const key =
      (req.header("apikey") ?? req.header("x-api-key") ?? "").trim();

    if (key !== expected) {
      fail(res, 401, DomainErrors.invalidApiKey().message);
      return;
    }
    next();
  };
}
