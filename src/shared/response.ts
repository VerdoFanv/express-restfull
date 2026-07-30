import type { Response } from "express";

export type Envelope<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

export function success<T>(
  res: Response,
  status: number,
  message: string,
  data?: T,
): Response {
  const body: Envelope<T> = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(status).json(body);
}

export function fail(
  res: Response,
  status: number,
  message: string,
  errors?: unknown,
): Response {
  const body: Envelope = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(status).json(body);
}

export function ok<T>(res: Response, message: string, data?: T): Response {
  return success(res, 200, message, data);
}

export function created<T>(res: Response, message: string, data?: T): Response {
  return success(res, 201, message, data);
}
