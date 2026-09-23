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

export async function atualizarBandas(req: Request, res: Response): Promise<void> {
  const { faixas } = req.body as {
    faixas?: { id: string; faixa_min: number; faixa_max: number; multiplo: number }[];
  };
  if (!Array.isArray(faixas) || faixas.length === 0) {
    res.status(400).json({ success: false, error: 'Campo "faixas" (array não vazio) é obrigatório' });
    return;
  }
  const edicoes = faixas.map((f) => ({ id: f.id, faixaMin: f.faixa_min, faixaMax: f.faixa_max, multiplo: f.multiplo }));
  const atualizadas = await service.atualizarBandas(edicoes);
  res.json({ success: true, data: atualizadas });
}
