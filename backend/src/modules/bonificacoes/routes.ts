import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const bonificacoesRouter = Router();

bonificacoesRouter.use(authMiddleware);

// Qualquer colaborador autenticado vê a própria bonificação — sem
// requireRole aqui, o escopo (só as dele) é aplicado no service.
bonificacoesRouter.get('/minhas', controller.listMinhas);

// requireRole é só o portão grosso (MASTER/ADMIN/GERENTES) — a exigência
// mais fina ("GERENTES só se for do departamento de Marketing") é
// responsabilidade do service (assertPodeGerenciar), igual o padrão já
// usado em indicators/service.ts para escopo por departamento.
bonificacoesRouter.get('/', requireRole('MASTER', 'ADMIN', 'GERENTES'), controller.list);
bonificacoesRouter.post('/', requireRole('MASTER', 'ADMIN', 'GERENTES'), controller.create);
bonificacoesRouter.get('/:id', requireRole('MASTER', 'ADMIN', 'GERENTES'), controller.getById);
bonificacoesRouter.patch('/:id', requireRole('MASTER', 'ADMIN', 'GERENTES'), controller.update);
bonificacoesRouter.delete('/:id', requireRole('MASTER', 'ADMIN', 'GERENTES'), controller.remove);
// Sem body: participantes são sempre recalculados a partir da regra de
// elegibilidade (ativo, admitido até 31/12 do ano anterior ao mês de
// referência, exceto MASTER/ADMIN) — nunca uma lista escolhida na mão.
bonificacoesRouter.put(
  '/:id/participantes',
  requireRole('MASTER', 'ADMIN', 'GERENTES'),
  controller.sincronizarParticipantes,
);
bonificacoesRouter.patch(
  '/:id/participantes/:usuarioId',
  requireRole('MASTER', 'ADMIN', 'GERENTES'),
  controller.atualizarNotaParticipante,
);
bonificacoesRouter.patch('/:id/pagamento', requireRole('MASTER', 'ADMIN', 'GERENTES'), controller.setPaga);
