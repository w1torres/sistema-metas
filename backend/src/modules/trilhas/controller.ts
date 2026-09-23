import type { Request, Response } from 'express';
import * as repository from './repository.js';
import * as service from './service.js';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await repository.findAll() });
}

export async function atualizarPesos(req: Request, res: Response): Promise<void> {
  const { pilares } = req.body as { pilares?: { pilar: string; peso: number }[] };
  if (!Array.isArray(pilares) || pilares.length === 0) {
    res.status(400).json({ success: false, error: 'Campo "pilares" (array não vazio) é obrigatório' });
    return;
  }
  const trilha = await service.atualizarPesos(req.params.id, pilares);
  res.json({ success: true, data: trilha });
}
