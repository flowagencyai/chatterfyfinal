import { Request, Response } from 'express';
import { z } from 'zod';
import { generateWithProvider } from '@core/generate';
import { deepseekAdapter } from '@core/adapters/deepseek';
import prisma from '../db/prisma';
import { recordUsage } from '../util/metering';

const ContentPart = z.union([
  z.string(),
  z.object({ type: z.literal('image_url'), url: z.string() }),
  z.object({ type: z.literal('file_id'), id: z.string() })
]);

const schema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system','user','assistant','tool']).default('user'),
    content: z.union([z.string(), z.array(ContentPart)])
  })),
  provider: z.enum(['deepseek']).default('deepseek'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional(),
  thread_id: z.string().optional()
});

async function expandFiles(orgId: string, content: any): Promise<string> {
  // Converte partes 'file_id' em um bloco textual com nomes/tamanhos (MVP).
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const lines: string[] = [];
    for (const p of content) {
      if (typeof p === 'string') { lines.push(p); continue; }
      if (p.type === 'file_id') {
        const f = await prisma.fileAsset.findFirst({ where: { id: p.id, orgId } });
        if (f) lines.push(`[ANEXO] ${f.filename} (${Math.round(f.sizeBytes/1024)} KB) -> /v1/files/${f.id}`);
      }
      if (p.type === 'image_url') {
        lines.push(`[IMAGEM] ${p.url}`);
      }
    }
    return lines.join('\n');
  }
  return JSON.stringify(content);
}

export async function routeChatCompletions(req: Request, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const body = parsed.data;
  const t = (req as any).tenant || { orgId: 'public', userId: 'anonymous' };

  // Expande anexos para texto (para todos os provedores, MVP)
  const expandedMessages = [];
  for (const m of body.messages) {
    const content = await expandFiles(t.orgId, m.content);
    expandedMessages.push({ role: m.role, content });
  }

  // Streaming para DeepSeek
  if (body.stream && body.provider === 'deepseek') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    let closed = false;
    req.on('close', () => { closed = true; });
    const ping = setInterval(() => {
      if (closed) return;
      res.write(`event: ping\n`);
      res.write(`data: ""\n\n`);
    }, 15000);
    let promptTokens: number|undefined; let completionTokens: number|undefined; let totalTokens: number|undefined;
    try {
      // Usar apenas o adapter do DeepSeek
      await deepseekAdapter.stream({ ...body, messages: expandedMessages }, (delta, usage) => {
        if (closed) return;
        if (delta) {
          res.write(`event: token\n`);
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
        if (usage) {
          promptTokens = usage.prompt_tokens ?? promptTokens;
          completionTokens = usage.completion_tokens ?? completionTokens;
          totalTokens = usage.total_tokens ?? totalTokens;
        }
      });
      if (!closed) {
        res.write(`event: done\n`);
        res.write(`data: "ok"\n\n`);
      }
    } catch (e:any) {
      if (!closed) {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ message: e?.message || 'stream error' })}\n\n`);
      }
    } finally {
      clearInterval(ping);
      if (!closed) res.end();
      const usage = { prompt_tokens: promptTokens ?? null, completion_tokens: completionTokens ?? null, total_tokens: totalTokens ?? null };
      recordUsage({ ts: Date.now(), provider: body.provider, model: body.model, orgId: t.orgId, userId: t.userId, ...usage });
    }
    return;
  }

  // Fallback não-streaming
  try {
    const out = await generateWithProvider({ ...body, messages: expandedMessages });
    const responsePayload = {
      id: `chatcmpl_${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now()/1000),
      model: body.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: out.text },
        finish_reason: 'stop'
      }],
      usage: out.usage || { prompt_tokens: null, completion_tokens: null, total_tokens: null }
    };
    const usage = out.usage || {};
    recordUsage({
      ts: Date.now(),
      provider: body.provider,
      model: body.model,
      orgId: t.orgId,
      userId: t.userId,
      prompt_tokens: usage.prompt_tokens ?? null,
      completion_tokens: usage.completion_tokens ?? null,
      total_tokens: usage.total_tokens ?? null
    });
    return res.json(responsePayload);
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
