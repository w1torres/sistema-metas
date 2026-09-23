import type { Request, Response } from 'express';
import Joi from 'joi';
import * as usersService from './service.js';
import { isoDateOnly } from '../../utils/dates.js';

// Nunca deixa um Date puro do Joi chegar no INSERT/UPDATE (ver utils/dates.ts
// — o driver pg grava um dia antes em fusos negativos, como Brasília).
function corrigirDatas<T extends { data_nascimento?: unknown; data_admissao?: unknown }>(value: T): T {
  if (value.data_nascimento !== undefined) value.data_nascimento = isoDateOnly(value.data_nascimento) as never;
  if (value.data_admissao !== undefined) value.data_admissao = isoDateOnly(value.data_admissao) as never;
  return value;
}

const dataSchema = Joi.date().iso().max('now');
const ROLES = ['MASTER', 'ADMIN', 'GERENTES', 'COORDENADORES_SUPERVISORES', 'COLABORADOR'] as const;

const camposCadastro = {
  cpf: Joi.string().allow(null, ''),
  cargo_id: Joi.string().uuid().allow(null, ''),
  data_nascimento: Joi.date().iso().allow(null, ''),
  data_admissao: dataSchema.allow(null, '').messages({ 'date.max': 'Data de admissão não pode ser no futuro' }),
  filial: Joi.string().allow(null, ''),
};

// Email é opcional — quem ainda não tem email corporativo entra cadastrado
// mas sem acesso, identificado só pelo CPF (ver ImportUsuariosModal.tsx no
// frontend) até alguém completar o cadastro depois. Por isso o serviço
// (não o Joi) exige pelo menos um dos dois — aqui só valida o formato.
const createUserSchema = Joi.object({
  email: Joi.string().email().allow(null, ''),
  nome: Joi.string().min(2).required(),
  departamento_id: Joi.string().uuid().required(),
  role: Joi.string().valid(...ROLES).required(),
  ...camposCadastro,
});

const updateUserSchema = Joi.object({
  nome: Joi.string().min(2),
  email: Joi.string().email().allow(null, ''),
  departamento_id: Joi.string().uuid(),
  role: Joi.string().valid(...ROLES),
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
  const user = await usersService.createUser(corrigirDatas(value));
  res.status(201).json({ success: true, data: user });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { value, error } = updateUserSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  const user = await usersService.updateUser(req.params.id, corrigirDatas(value));
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

export async function remove(req: Request, res: Response): Promise<void> {
  await usersService.removeUser(req.params.id, req.user!.id);
  res.status(204).send();
}
