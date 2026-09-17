import type { Request, Response } from 'express';
import Joi from 'joi';
import * as authService from './service.js';

function validar<T>(schema: Joi.ObjectSchema<T>, body: unknown, res: Response): T | undefined {
  const { value, error } = schema.validate(body);
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return undefined;
  }
  return value;
}

// Login dev-mode antigo — só email, sem senha. Ver env.auth.devLoginEnabled
// (service.ts rejeita com 403 se a flag estiver desligada).
export async function loginDevMode(req: Request, res: Response): Promise<void> {
  const value = validar(Joi.object({ email: Joi.string().email().required() }), req.body, res);
  if (!value) return;

  const { token, user } = await authService.loginDevMode(value.email);
  res.json({ success: true, data: { token, user } });
}

export async function loginSenha(req: Request, res: Response): Promise<void> {
  const value = validar(
    Joi.object({ email: Joi.string().email().required(), senha: Joi.string().required() }),
    req.body,
    res,
  );
  if (!value) return;

  const { token, user } = await authService.loginSenha(value.email, value.senha);
  res.json({ success: true, data: { token, user } });
}

export async function loginEntraId(req: Request, res: Response): Promise<void> {
  const value = validar(
    Joi.object({ idToken: Joi.string(), email: Joi.string().email() }).or('idToken', 'email'),
    req.body,
    res,
  );
  if (!value) return;

  const { token, user } = await authService.loginEntraId(value);
  res.json({ success: true, data: { token, user } });
}

export async function solicitarDefinicaoSenha(req: Request, res: Response): Promise<void> {
  const value = validar(Joi.object({ email: Joi.string().email().required() }), req.body, res);
  if (!value) return;

  await authService.solicitarDefinicaoSenha(value.email);
  // Sempre sucesso — não revela se o email existe (ver service.ts).
  res.json({ success: true, data: { mensagem: 'Se o e-mail estiver cadastrado, um link foi enviado.' } });
}

export async function definirSenha(req: Request, res: Response): Promise<void> {
  const value = validar(
    Joi.object({ token: Joi.string().required(), novaSenha: Joi.string().min(8).required() }),
    req.body,
    res,
  );
  if (!value) return;

  const { token, user } = await authService.definirSenha(value.token, value.novaSenha);
  res.json({ success: true, data: { token, user } });
}
