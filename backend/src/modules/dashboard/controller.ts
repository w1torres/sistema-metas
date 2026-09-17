import type { Request, Response } from 'express';
import * as service from './service.js';

export async function stats(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await service.getStats(req.user!) });
}
