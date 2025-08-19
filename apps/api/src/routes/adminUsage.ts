import { Request, Response } from 'express';
import prisma from '../db/prisma';

function parseDate(s?: string) {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * GET /admin/usage?org=ORG_ID&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Retorna agregação diária por organização: tokens e custo.
 */
export async function routeAdminUsage(req: Request, res: Response) {
  const org = (req.query.org as string) || undefined;
  const from = parseDate(req.query.from as string) || new Date(Date.now() - 7*24*3600*1000);
  const to = parseDate(req.query.to as string) || new Date();

  const where: any = { ts: { gte: from, lte: to } };
  if (org) where.orgId = org;

  try {
    const rows = await prisma.usage.groupBy({
      by: ['day', 'orgId'],
      where,
      _sum: {
        prompt_tokens: true,
        completion_tokens: true,
        total_tokens: true,
        cost_usd: true
      },
      orderBy: { day: 'asc' }
    });

    return res.json({
      org: org || 'ALL',
      from: from.toISOString(),
      to: to.toISOString(),
      data: rows.map(r => ({
        day: r.day,
        orgId: r.orgId,
        prompt_tokens: r._sum.prompt_tokens || 0,
        completion_tokens: r._sum.completion_tokens || 0,
        total_tokens: r._sum.total_tokens || 0,
        cost_usd: r._sum.cost_usd || 0
      }))
    });
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
