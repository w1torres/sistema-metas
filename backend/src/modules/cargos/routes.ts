import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const cargosRouter = Router();

cargosRouter.use(authMiddleware);
cargosRouter.get('/', controller.list);
cargosRouter.post('/', requireRole('MASTER'), controller.create);
