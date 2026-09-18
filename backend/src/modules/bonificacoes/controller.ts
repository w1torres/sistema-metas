import type { Request, Response } from 'express';
import Joi from 'joi';
import * as service from './service.js';

function ok(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

const bonificacaoSchema = Joi.object({
  fornecedor: Joi.string().min(2).max(255).required(),
  valor_total: Joi.number().positive().required(),
  // 'YYYY-MM'
  mes_referencia: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .required(),
});

const bonificacaoUpdateSchema = Joi.object({
  fornecedor: Joi.string().min(2).max(255),
  valor_total: Joi.number().positive(),
  mes_referencia: Joi.string().pattern(/^\d{4}-\d{2}$/),
}).min(1);

const pagaSchema = Joi.object({
  paga: Joi.boolean().required(),
});

const notaSchema = Joi.object({
  percentual_nota: Joi.number().min(0).max(100).required(),
});

export async function list(req: Request, res: Response): Promise<void> {
  ok(res, await service.listBonificacoes(req.user!));
}

export async function getById(req: Request, res: Response): Promise<void> {
  ok(res, await service.getBonificacao(req.user!, req.params.id));
}

export async function create(req: Request, res: Response): Promise<void> {
  const { value, error } = bonificacaoSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  ok(res, await service.createBonificacao(req.user!, value), 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { value, error } = bonificacaoUpdateSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  ok(res, await service.updateBonificacao(req.user!, req.params.id, value));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.removeBonificacao(req.user!, req.params.id);
  res.status(204).send();
}

export async function setPaga(req: Request, res: Response): Promise<void> {
  const { value, error } = pagaSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  ok(res, await service.setPaga(req.user!, req.params.id, value.paga));
}

export async function sincronizarParticipantes(req: Request, res: Response): Promise<void> {
  ok(res, await service.sincronizarParticipantes(req.user!, req.params.id));
}

export async function atualizarNotaParticipante(req: Request, res: Response): Promise<void> {
  const { value, error } = notaSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  ok(
    res,
    await service.atualizarNotaParticipante(req.user!, req.params.id, req.params.usuarioId, value.percentual_nota),
  );
}

export async function listMinhas(req: Request, res: Response): Promise<void> {
  ok(res, await service.listMinhasBonificacoes(req.user!));
}
