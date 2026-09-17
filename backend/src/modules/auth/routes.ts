import { Router } from 'express';
import * as controller from './controller.js';

export const authRouter = Router();

authRouter.post('/login', controller.login);
