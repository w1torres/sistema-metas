import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ success: false, error: err.message });
    return;
  }

  logger.error('Erro não tratado', err);
  res.status(500).json({ success: false, error: 'Erro interno do servidor' });
}
