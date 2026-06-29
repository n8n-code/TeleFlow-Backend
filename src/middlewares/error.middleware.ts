import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { error as sendError } from '../utils/response.js';

/**
 * Global Fastify error handler.
 *
 * Handles AppError, ZodError, Fastify validation errors, and unexpected errors
 * with structured JSON responses.
 */
export function errorHandler(
  err: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  // ─── AppError (our own error type) ──────────────────────────────
  if (err instanceof AppError) {
    logger.warn(
      { code: err.code, statusCode: err.statusCode, path: request.url },
      err.message,
    );
    sendError(reply, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // ─── ZodError (validation library) ─────────────────────────────
  if (err.name === 'ZodError') {
    const zodErr = err as Error & { issues?: unknown[] };
    logger.warn({ path: request.url, issues: zodErr.issues }, 'Zod validation error');
    sendError(reply, 422, 'VALIDATION_ERROR', 'Validation failed', zodErr.issues);
    return;
  }

  // ─── Fastify validation error (ajv) ────────────────────────────
  const fastifyErr = err as FastifyError;
  if (fastifyErr.validation) {
    logger.warn(
      { path: request.url, validation: fastifyErr.validation },
      'Request validation error',
    );
    sendError(reply, 422, 'VALIDATION_ERROR', 'Validation failed', fastifyErr.validation);
    return;
  }

  // ─── Unexpected / internal error ───────────────────────────────
  logger.error(
    { err, path: request.url, method: request.method },
    'Unhandled error',
  );
  sendError(reply, 500, 'INTERNAL_ERROR', 'Internal server error');
}
