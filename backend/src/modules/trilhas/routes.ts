import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const trilhasRouter = Router();

trilhasRouter.use(authMiddleware);
trilhasRouter.get('/', controller.list);
trilhasRouter.put('/:id/pilares', requireRole('MASTER'), controller.atualizarPesos);
