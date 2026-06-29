import type { FastifyReply } from 'fastify';
import type { ApiSuccess, ApiError } from '../types/index.js';

export function success<T>(reply: FastifyReply, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  reply.status(statusCode).send(body);
}

export function error(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ApiError = {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
  reply.status(statusCode).send(body);
}
