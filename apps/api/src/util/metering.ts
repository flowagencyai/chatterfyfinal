import fs from 'fs';
import path from 'path';
import prisma from '../db/prisma';
import { estimateCostUSD } from '@shared/pricing';
import { UsageRecord } from '@shared/types';

const USAGE_FILE = process.env.USAGE_FILE || '/mnt/data/usage.json';

export async function recordUsage(u: UsageRecord) {
  const { total } = estimateCostUSD(u.provider, u.model, u.prompt_tokens ?? undefined, u.completion_tokens ?? undefined);

  // compute 'day' (UTC date boundary)
  const d = new Date(u.ts);
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  try {
    await prisma.usage.create({
      data: {
        ts: new Date(u.ts),
        day,
        provider: u.provider,
        model: u.model,
        orgId: u.orgId,
        userId: u.userId,
        prompt_tokens: u.prompt_tokens ?? null,
        completion_tokens: u.completion_tokens ?? null,
        total_tokens: u.total_tokens ?? null,
        cost_usd: total as any
      }
    });
  } catch (e) {
    console.error('[metering] db error, falling back to file', e);
    try {
      const rec = { ...u, cost_usd: total };
      const line = JSON.stringify(rec) + '\n';
      fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
      fs.appendFileSync(USAGE_FILE, line, 'utf-8');
    } catch (err) {
      console.error('[metering] file write error', err);
    }
  }
}
