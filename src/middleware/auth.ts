import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DomainErrors } from "@/domain/errors.js";
import { fail } from "@/shared/response.js";

export type JwtClaims = {
  userId: number;
  type: "access" | "refresh";
};

export function auth(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header("authorization") ?? "";
    if (!header.startsWith("Bearer ")) {
      fail(res, 401, DomainErrors.unauthorized().message);
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    try {
      const claims = jwt.verify(token, secret) as JwtClaims;
      if (claims.type && claims.type !== "access") {
        fail(res, 401, DomainErrors.unauthorized().message);
        return;
      }
      req.userId = claims.userId;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        fail(res, 401, DomainErrors.tokenExpired().message);
        return;
      }
      fail(res, 401, DomainErrors.unauthorized().message);
    }
  };
}
