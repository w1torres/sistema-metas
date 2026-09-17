import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer/index.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let transporter: Mail | null = null;

function getTransporter(): Mail | null {
  if (!env.smtp.host) return null;
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
  });
  return transporter;
}

interface EnviarEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Sem SMTP configurado (SMTP_HOST vazio — comum em dev), não falha: só loga
// o conteúdo no console, pra dar pra testar o fluxo de definição de senha
// sem precisar de credenciais de email reais.
export async function enviarEmail({ to, subject, html }: EnviarEmailInput): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    logger.warn(`[email] SMTP não configurado — email não enviado de verdade. Para: ${to} | Assunto: ${subject}`);
    logger.warn(`[email] Conteúdo:\n${html}`);
    return;
  }

  await transport.sendMail({ from: env.smtp.from, to, subject, html });
}
