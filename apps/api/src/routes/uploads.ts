import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import prisma from '../db/prisma';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/mnt/data/uploads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${unique}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: {
    fileSize: (Number(process.env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024)
  }
}).array('files', 10);

/**
 * POST /v1/files  (multipart/form-data)
 * headers: X-Org-Id, X-User-Id
 */
export function routeUpload(req: Request, res: Response) {
  upload(req, res, async (err: any) => {
    if (err) return res.status(400).json({ error: err.message || 'upload error' });
    const t = (req as any).tenant || { orgId: 'public', userId: 'anonymous' };
    const files = (req as any).files as Express.Multer.File[];
    const saved = [];
    for (const f of files) {
      const buf = fs.readFileSync(f.path);
      const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
      const rec = await prisma.fileAsset.create({
        data: {
          orgId: t.orgId,
          userId: t.userId || null,
          filename: f.originalname,
          mime: f.mimetype,
          sizeBytes: f.size,
          sha256,
          storagePath: f.path
        }
      });
      saved.push({ id: rec.id, filename: rec.filename, mime: rec.mime, sizeBytes: rec.sizeBytes });
    }
    res.json({ uploaded: saved });
  });
}

/**
 * GET /v1/files/:id  (DEV: entrega direta; em produção, gere URL assinada S3)
 */
export async function routeGetFile(req: Request, res: Response) {
  const id = req.params.id;
  const t = (req as any).tenant || { orgId: 'public' };
  const file = await prisma.fileAsset.findFirst({ where: { id, orgId: t.orgId } });
  if (!file) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Content-Type', file.mime);
  res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
  fs.createReadStream(file.storagePath).pipe(res);
}
