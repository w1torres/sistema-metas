import type { Request, Response } from 'express';
import * as service from './service.js';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await service.listFaixas() });
}

export async function updateMultiplo(req: Request, res: Response): Promise<void> {
  const { multiplo } = req.body as { multiplo?: number };
  if (typeof multiplo !== 'number') {
    res.status(400).json({ success: false, error: 'Campo "multiplo" (number) é obrigatório' });
    return;
  }
  const faixa = await service.updateMultiplo(req.params.id, multiplo);
  res.json({ success: true, data: faixa });
}
