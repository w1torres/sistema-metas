import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const atingimentoRouter = Router();

atingimentoRouter.use(authMiddleware);
atingimentoRouter.get('/faixas', controller.list);
atingimentoRouter.put('/faixas', requireRole('MASTER'), controller.atualizarFaixas);
