export class AppError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_FOUND"
      | "INVALID"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "EMAIL_TAKEN"
      | "TOKEN_EXPIRED"
      | "INVALID_API_KEY"
      | "INTERNAL",
    readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const DomainErrors = {
  notFound: () => new AppError("not found", "NOT_FOUND", 404),
  invalid: () => new AppError("invalid input", "INVALID", 400),
  unauthorized: () => new AppError("unauthorized", "UNAUTHORIZED", 401),
  forbidden: () => new AppError("forbidden", "FORBIDDEN", 403),
  emailTaken: () => new AppError("email already registered", "EMAIL_TAKEN", 409),
  // Message matches Wisteria mobile interceptor contract.
  tokenExpired: () =>
    new AppError("Unauthorized: Token expired", "TOKEN_EXPIRED", 401),
  invalidApiKey: () => new AppError("invalid api key", "INVALID_API_KEY", 401),
  internal: (message = "internal error") =>
    new AppError(message, "INTERNAL", 500),
} as const;

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
