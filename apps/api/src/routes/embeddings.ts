import { Request, Response } from 'express';
import { z } from 'zod';
import { embeddingsWithProvider } from '@core/generate';

const schema = z.object({
  model: z.string(),
  input: z.union([z.string(), z.array(z.string())]),
  provider: z.enum(['openai','google']).default('openai')
});

export async function routeEmbeddings(req: Request, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const out = await embeddingsWithProvider(parsed.data);
    return res.json({
      object: 'list',
      data: out.vectors.map((v,i) => ({
        object: 'embedding',
        index: i,
        embedding: v
      })),
      model: parsed.data.model,
      usage: out.usage || {}
    });
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
