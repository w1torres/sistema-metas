import type { Request, Response } from 'express';
import * as service from './service.js';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await service.listFaixas() });
}

export async function atualizarFaixas(req: Request, res: Response): Promise<void> {
  const { faixas } = req.body as {
    faixas?: { id: string; faixa_min: number; faixa_max: number; percentual_peso: number }[];
  };
  if (!Array.isArray(faixas) || faixas.length === 0) {
    res.status(400).json({ success: false, error: 'Campo "faixas" (array não vazio) é obrigatório' });
    return;
  }
  const edicoes = faixas.map((f) => ({
    id: f.id,
    faixaMin: f.faixa_min,
    faixaMax: f.faixa_max,
    percentualPeso: f.percentual_peso,
  }));
  const atualizadas = await service.atualizarFaixas(edicoes);
  res.json({ success: true, data: atualizadas });
}
