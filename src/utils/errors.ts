export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// ─── Pre-built Errors ────────────────────────────────────────────

export const Errors = {
  unauthorized: (message = 'Unauthorized') =>
    new AppError(401, 'UNAUTHORIZED', message),

  forbidden: (message = 'Forbidden') =>
    new AppError(403, 'FORBIDDEN', message),

  notFound: (resource: string) =>
    new AppError(404, `${resource.toUpperCase()}_NOT_FOUND`, `${resource} not found`),

  badRequest: (message: string, details?: unknown) =>
    new AppError(400, 'BAD_REQUEST', message, details),

  conflict: (message: string) =>
    new AppError(409, 'CONFLICT', message),

  validationError: (details: unknown) =>
    new AppError(422, 'VALIDATION_ERROR', 'Validation failed', details),

  tooManyRequests: (message = 'Too many requests') =>
    new AppError(429, 'TOO_MANY_REQUESTS', message),

  internal: (message = 'Internal server error') =>
    new AppError(500, 'INTERNAL_ERROR', message),

  telegramError: (message: string, details?: unknown) =>
    new AppError(502, 'TELEGRAM_ERROR', message, details),

  sessionNotConnected: (sessionId: string) =>
    new AppError(400, 'SESSION_NOT_CONNECTED', `Session ${sessionId} is not connected`),

  sessionNotFound: (sessionId: string) =>
    new AppError(404, 'SESSION_NOT_FOUND', `Session ${sessionId} not found`),
} as const;
