import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const departamentosRouter = Router();

departamentosRouter.use(authMiddleware);
departamentosRouter.get('/', controller.list);
departamentosRouter.post('/', requireRole('MASTER'), controller.create);
