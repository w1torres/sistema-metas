import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const usersRouter = Router();

usersRouter.use(authMiddleware, requireRole('MASTER'));
usersRouter.get('/', controller.list);
usersRouter.post('/', controller.create);
usersRouter.put('/:id', controller.update);
usersRouter.patch('/:id/ativo', controller.toggleAtivo);
