import type { Request, Response } from 'express';
import Joi from 'joi';
import * as service from './service.js';

const createSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  descricao: Joi.string().allow(null, ''),
});

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await service.listDepartamentos() });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { value, error } = createSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  const departamento = await service.createDepartamento(value.nome, value.descricao);
  res.status(201).json({ success: true, data: departamento });
}
