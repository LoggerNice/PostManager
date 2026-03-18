import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      issues: err.issues,
    });
  }

  const maybe = err as { message?: string; code?: string };
  return res.status(500).json({
    error: maybe?.code ?? 'InternalServerError',
    message: maybe?.message ?? 'Unexpected error',
  });
}

