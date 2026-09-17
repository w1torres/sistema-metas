import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { uploadAttachment, uploadImportFile } from '../../middleware/upload.js';
import * as controller from './controller.js';

export const indicatorsRouter = Router();

indicatorsRouter.use(authMiddleware);

indicatorsRouter.get('/me', controller.listMinhas);
indicatorsRouter.get('/', requireRole('MASTER', 'GESTOR'), controller.list);
indicatorsRouter.post('/', requireRole('MASTER', 'GESTOR'), controller.create);
indicatorsRouter.post('/import', requireRole('MASTER', 'GESTOR'), uploadImportFile.single('file'), controller.importPlanilha);

indicatorsRouter.get('/:id', controller.getById);
indicatorsRouter.put('/:id', requireRole('MASTER', 'GESTOR'), controller.update);
indicatorsRouter.delete('/:id', requireRole('MASTER'), controller.remove);
indicatorsRouter.patch('/:id/reatribuir', requireRole('MASTER', 'GESTOR'), controller.reatribuir);

indicatorsRouter.patch('/:id/complete', controller.solicitarConclusao);
indicatorsRouter.patch('/:id/complete/cancelar', controller.cancelarSolicitacao);
indicatorsRouter.patch('/:id/complete/desfazer', controller.desfazerConclusao);
indicatorsRouter.patch('/:id/approve', requireRole('MASTER', 'GESTOR'), controller.aprovar);

indicatorsRouter.get('/:id/history', controller.history);
indicatorsRouter.get('/:id/attachments', controller.listAttachments);
indicatorsRouter.post('/:id/attachments', uploadAttachment.single('file'), controller.addAttachment);
indicatorsRouter.delete('/:id/attachments/:attachmentId', controller.removeAttachment);
