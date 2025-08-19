import { Request, Response } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import crypto from 'crypto';
import prisma from '../db/prisma';

const USE_S3 = process.env.USE_S3 === 'true';
const S3_BUCKET = process.env.AWS_S3_BUCKET || '';
const S3_REGION = process.env.AWS_S3_REGION || 'us-east-1';
const S3_ENDPOINT = process.env.AWS_S3_ENDPOINT || undefined; // opcional (MinIO etc.)

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT || undefined,
  forcePathStyle: !!S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

/**
 * POST /v1/files/presign { filename, mime, sizeBytes }
 * Retorna URL/fields para upload direto ao S3. Após o upload 204, chame /v1/files/confirm.
 */
export async function routePresign(req: Request, res: Response) {
  if (!USE_S3) return res.status(400).json({ error: 'S3 disabled' });
  const t = (req as any).tenant || { orgId: 'public', userId: 'anonymous' };
  const { filename, mime, sizeBytes } = req.body || {};
  if (!filename || !mime || !sizeBytes) return res.status(400).json({ error: 'filename, mime, sizeBytes required' });

  // key: orgId/uuid/filename
  const key = `${t.orgId}/${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    const presigned = await createPresignedPost(s3, {
      Bucket: S3_BUCKET,
      Key: key,
      Conditions: [
        ["content-length-range", 1, Number(process.env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024],
        { "Content-Type": mime }
      ],
      Fields: { "Content-Type": mime },
      Expires: 300 // 5 min
    });

    // create temp record? We'll store after confirm; send back key
    return res.json({ url: presigned.url, fields: presigned.fields, key, bucket: S3_BUCKET });
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'presign error' });
  }
}

/**
 * POST /v1/files/confirm { key, filename, mime, sizeBytes }
 * Registra o FileAsset após upload ao S3.
 */
export async function routeConfirmUpload(req: Request, res: Response) {
  if (!USE_S3) return res.status(400).json({ error: 'S3 disabled' });
  const t = (req as any).tenant || { orgId: 'public', userId: 'anonymous' };
  const { key, filename, mime, sizeBytes } = req.body || {};
  if (!key || !filename || !mime || !sizeBytes) return res.status(400).json({ error: 'key, filename, mime, sizeBytes required' });

  const rec = await prisma.fileAsset.create({
    data: {
      orgId: t.orgId,
      userId: t.userId || null,
      filename,
      mime,
      sizeBytes: Number(sizeBytes),
      sha256: 's3', // opcional (pode calcular sob demanda via HEAD/ETag)
      storagePath: `s3://${process.env.AWS_S3_BUCKET}/${key}`
    }
  });
  res.json({ id: rec.id, filename: rec.filename, mime: rec.mime, sizeBytes: rec.sizeBytes });
}
