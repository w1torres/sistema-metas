import type { Request, Response } from 'express';
import Joi from 'joi';
import * as authService from './service.js';

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
});

export async function login(req: Request, res: Response): Promise<void> {
  const { value, error } = loginSchema.validate(req.body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }

  const { token, user } = await authService.login(value.email);
  res.json({ success: true, data: { token, user } });
}
