import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';

fs.mkdirSync(env.storage.localPath, { recursive: true });

const attachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.storage.localPath),
  filename: (_req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${suffix}${path.extname(file.originalname)}`);
  },
});

export const uploadAttachment = multer({
  storage: attachmentStorage,
  limits: { fileSize: env.storage.maxFileSize },
});

const IMPORT_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const uploadImportFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.import.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (!IMPORT_MIME_TYPES.includes(file.mimetype) && !file.originalname.match(/\.(csv|xlsx?)$/i)) {
      cb(new Error('Arquivo inválido — envie um .xlsx ou .csv'));
      return;
    }
    cb(null, true);
  },
});
