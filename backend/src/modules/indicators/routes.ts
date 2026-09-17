import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { uploadAttachment, uploadImportFile } from '../../middleware/upload.js';
import * as controller from './controller.js';

export const indicatorsRouter = Router();

indicatorsRouter.use(authMiddleware);

const GESTAO_ROLES = ['MASTER', 'ADMIN', 'GERENTES', 'COORDENADORES_SUPERVISORES'] as const;

indicatorsRouter.get('/me', controller.listMinhas);
indicatorsRouter.get('/', requireRole(...GESTAO_ROLES), controller.list);
indicatorsRouter.post('/', requireRole(...GESTAO_ROLES), controller.create);
indicatorsRouter.post('/import', requireRole(...GESTAO_ROLES), uploadImportFile.single('file'), controller.importPlanilha);

indicatorsRouter.get('/:id', controller.getById);
indicatorsRouter.put('/:id', requireRole(...GESTAO_ROLES), controller.update);
indicatorsRouter.delete('/:id', requireRole('MASTER', 'ADMIN'), controller.remove);
indicatorsRouter.patch('/:id/reatribuir', requireRole(...GESTAO_ROLES), controller.reatribuir);

indicatorsRouter.patch('/:id/complete', controller.solicitarConclusao);
indicatorsRouter.patch('/:id/complete/cancelar', controller.cancelarSolicitacao);
indicatorsRouter.patch('/:id/complete/desfazer', controller.desfazerConclusao);
// GESTAO_ROLES pode CHAMAR o endpoint — o service.aprovar() é quem decide
// quem pode aprovar o quê em cada etapa (1º nível: gerentes/coordenadores;
// 2º nível/final: só MASTER — ver comentário em indicators/service.ts).
indicatorsRouter.patch('/:id/approve', requireRole(...GESTAO_ROLES), controller.aprovar);

indicatorsRouter.get('/:id/history', controller.history);
indicatorsRouter.get('/:id/attachments', controller.listAttachments);
indicatorsRouter.post('/:id/attachments', uploadAttachment.single('file'), controller.addAttachment);
indicatorsRouter.delete('/:id/attachments/:attachmentId', controller.removeAttachment);
