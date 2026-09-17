import type { Request, Response } from 'express';
import * as repository from './repository.js';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await repository.findAll() });
}
