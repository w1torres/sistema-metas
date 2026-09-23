import type { Request, Response } from 'express';
import Joi from 'joi';
import * as service from './service.js';
import { importarIndicadores } from './import.js';
import { ApiError } from '../../utils/ApiError.js';
import { isoDateOnly } from '../../utils/dates.js';
import type { IndicadorStatus } from '../../types/index.js';

function ok(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

export async function list(req: Request, res: Response): Promise<void> {
  const { departamento, status, search } = req.query as Record<string, string | undefined>;
  const data = await service.listIndicadores(req.user!, {
    status: status as IndicadorStatus | undefined,
    search,
  });
  // Qualquer papel pode filtrar por departamento explicitamente quando tem
  // acesso amplo (MASTER/ADMIN) — gerentes/coordenadores já são escopados
  // ao próprio departamento no service.
  const filtrado = departamento ? data.filter((i) => i.departamento_id === departamento) : data;
  ok(res, filtrado);
}

export async function listMinhas(req: Request, res: Response): Promise<void> {
  ok(res, await service.listMinhas(req.user!));
}

export async function getById(req: Request, res: Response): Promise<void> {
  ok(res, await service.getIndicador(req.user!, req.params.id));
}

const faixaAtingimentoSchema = Joi.object({
  faixa: Joi.string().required(),
  percentualPeso: Joi.number().min(0).max(100).required(),
});

const createSchema = Joi.object({
  departamento_id: Joi.string().uuid().allow(null, ''),
  usuario_responsavel_id: Joi.string().uuid().required(),
  nome: Joi.string().min(3).max(255).required(),
  peso: Joi.number().min(0).max(100).required(),
  objetivo: Joi.string().allow(null, ''),
  detalhamento: Joi.string().allow(null, ''),
  data_inicio: Joi.date().iso().required(),
  data_fim: Joi.date().iso().min(Joi.ref('data_inicio')).required(),
  funcao: Joi.string().allow(null, ''),
  pilar: Joi.string().allow(null, ''),
  meta: Joi.string().allow(null, ''),
  forma_medicao: Joi.string().allow(null, ''),
  evidencia_obrigatoria: Joi.string().allow(null, ''),
  tabela_atingimento: Joi.array().items(faixaAtingimentoSchema).allow(null),
});

export async function create(req: Request, res: Response): Promise<void> {
  const { value, error } = createSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  // Joi.date() converteu a string validada num Date — nunca deixa isso
  // chegar no INSERT (ver utils/dates.ts: o driver pg grava um dia antes em
  // fusos negativos, como Brasília).
  value.data_inicio = isoDateOnly(value.data_inicio);
  value.data_fim = isoDateOnly(value.data_fim);
  ok(res, await service.createIndicador(req.user!, value), 201);
}

const updateSchema = Joi.object({
  nome: Joi.string().min(3).max(255),
  peso: Joi.number().min(0).max(100),
  status: Joi.string().valid('EM_ANDAMENTO', 'ATRASADO', 'PAUSADO'),
  objetivo: Joi.string().allow(null, ''),
  detalhamento: Joi.string().allow(null, ''),
  data_inicio: Joi.date().iso(),
  data_fim: Joi.date().iso(),
  funcao: Joi.string().allow(null, ''),
  pilar: Joi.string().allow(null, ''),
  meta: Joi.string().allow(null, ''),
  forma_medicao: Joi.string().allow(null, ''),
  evidencia_obrigatoria: Joi.string().allow(null, ''),
  tabela_atingimento: Joi.array().items(faixaAtingimentoSchema).allow(null),
}).min(1);

export async function update(req: Request, res: Response): Promise<void> {
  const { value, error } = updateSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  if (value.data_inicio !== undefined) value.data_inicio = isoDateOnly(value.data_inicio);
  if (value.data_fim !== undefined) value.data_fim = isoDateOnly(value.data_fim);
  ok(res, await service.updateIndicador(req.user!, req.params.id, value));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.deleteIndicador(req.user!, req.params.id);
  res.status(204).send();
}

export async function reatribuir(req: Request, res: Response): Promise<void> {
  const { usuario_responsavel_id, motivo } = req.body as { usuario_responsavel_id?: string; motivo?: string };
  if (!usuario_responsavel_id) {
    res.status(400).json({ success: false, error: 'Campo "usuario_responsavel_id" é obrigatório' });
    return;
  }
  ok(res, await service.reatribuirIndicador(req.user!, req.params.id, usuario_responsavel_id, motivo));
}

export async function solicitarConclusao(req: Request, res: Response): Promise<void> {
  const { nota } = req.body as { nota?: string };
  ok(res, await service.solicitarConclusao(req.user!, req.params.id, nota));
}

export async function cancelarSolicitacao(req: Request, res: Response): Promise<void> {
  ok(res, await service.cancelarSolicitacao(req.user!, req.params.id));
}

export async function desfazerConclusao(req: Request, res: Response): Promise<void> {
  ok(res, await service.desfazerConclusao(req.user!, req.params.id));
}

export async function aprovar(req: Request, res: Response): Promise<void> {
  const { aprovado, observacao } = req.body as { aprovado?: boolean; observacao?: string };
  if (typeof aprovado !== 'boolean') {
    res.status(400).json({ success: false, error: 'Campo "aprovado" (boolean) é obrigatório' });
    return;
  }
  if (observacao && observacao.length > 500) {
    res.status(400).json({ success: false, error: 'Observação deve ter no máximo 500 caracteres' });
    return;
  }
  ok(res, await service.aprovar(req.user!, req.params.id, aprovado, observacao));
}

export async function history(req: Request, res: Response): Promise<void> {
  ok(res, await service.historyFor(req.user!, req.params.id));
}

export async function addAttachment(req: Request, res: Response): Promise<void> {
  if (!req.file) throw ApiError.badRequest('Arquivo não enviado (campo "file")');
  ok(
    res,
    await service.addAttachment(req.user!, req.params.id, {
      originalname: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
    }),
    201,
  );
}

export async function listAttachments(req: Request, res: Response): Promise<void> {
  ok(res, await service.listAttachments(req.user!, req.params.id));
}

export async function downloadAttachment(req: Request, res: Response): Promise<void> {
  const { path, nomeArquivo, tipoMime } = await service.getAttachmentFile(
    req.user!,
    req.params.id,
    req.params.attachmentId,
  );
  if (tipoMime) res.type(tipoMime);
  res.download(path, nomeArquivo);
}

export async function removeAttachment(req: Request, res: Response): Promise<void> {
  await service.removeAttachment(req.user!, req.params.id, req.params.attachmentId);
  res.status(204).send();
}

export async function importPlanilha(req: Request, res: Response): Promise<void> {
  if (!req.file) throw ApiError.badRequest('Arquivo não enviado (campo "file")');
  ok(res, await importarIndicadores(req.user!, req.file.buffer));
}
