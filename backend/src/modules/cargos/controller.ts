import type { Request, Response } from 'express';
import Joi from 'joi';
import * as service from './service.js';
import { PPR_GRUPOS } from '../../types/index.js';

const createSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  descricao: Joi.string().allow(null, ''),
  nivel: Joi.string().allow(null, ''),
  trilha_id: Joi.string().uuid().allow(null, ''),
  grupo_ppr: Joi.string().valid(...PPR_GRUPOS).allow(null),
});

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await service.listCargos() });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { value, error } = createSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  const cargo = await service.createCargo(value);
  res.status(201).json({ success: true, data: cargo });
}
