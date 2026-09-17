import type { Request, Response } from 'express';
import Joi from 'joi';
import * as usersService from './service.js';

const dataSchema = Joi.date().iso().max('now');

const camposCadastro = {
  cpf: Joi.string().allow(null, ''),
  matricula: Joi.string().allow(null, ''),
  cargo_id: Joi.string().uuid().allow(null, ''),
  data_nascimento: Joi.date().iso().allow(null, ''),
  data_admissao: dataSchema.allow(null, '').messages({ 'date.max': 'Data de admissão não pode ser no futuro' }),
  filial: Joi.string().allow(null, ''),
  endereco_completo: Joi.string().allow(null, ''),
  telefone: Joi.string().allow(null, ''),
  celular: Joi.string().allow(null, ''),
};

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  nome: Joi.string().min(2).required(),
  departamento_id: Joi.string().uuid().required(),
  role: Joi.string().valid('MASTER', 'GESTOR', 'COLABORADOR').required(),
  ...camposCadastro,
});

const updateUserSchema = Joi.object({
  nome: Joi.string().min(2),
  departamento_id: Joi.string().uuid(),
  role: Joi.string().valid('MASTER', 'GESTOR', 'COLABORADOR'),
  ...camposCadastro,
}).min(1);

export async function list(_req: Request, res: Response): Promise<void> {
  const users = await usersService.listUsers();
  res.json({ success: true, data: users });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { value, error } = createUserSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  const user = await usersService.createUser(value);
  res.status(201).json({ success: true, data: user });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { value, error } = updateUserSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  const user = await usersService.updateUser(req.params.id, value);
  res.json({ success: true, data: user });
}

export async function toggleAtivo(req: Request, res: Response): Promise<void> {
  const { ativo } = req.body as { ativo?: boolean };
  if (typeof ativo !== 'boolean') {
    res.status(400).json({ success: false, error: 'Campo "ativo" (boolean) é obrigatório' });
    return;
  }
  const user = await usersService.toggleAtivo(req.params.id, ativo, req.user!.id);
  res.json({ success: true, data: user });
}
