import { Request, Response } from 'express';
import prisma from '../db/prisma';

/**
 * POST /admin/set-plan { orgId, planCode }
 * Cria org se não existir; ativa assinatura do plano informado para a org.
 */
export async function routeAdminSetPlan(req: Request, res: Response) {
  const { orgId, planCode } = req.body || {};
  if (!orgId || !planCode) return res.status(400).json({ error: 'orgId and planCode required' });

  const plan = await prisma.plan.findUnique({ where: { code: planCode } });
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  let org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    org = await prisma.organization.create({ data: { id: orgId, name: orgId } });
  }

  // Deactivate previous active subs
  await prisma.subscription.updateMany({ where: { orgId, active: true }, data: { active: false } });
  // Create new sub for 30 days
  const now = new Date();
  const end = new Date(now.getTime() + 30*24*3600*1000);
  const sub = await prisma.subscription.create({
    data: { orgId, planId: plan.id, active: true, periodStart: now, periodEnd: end }
  });

  res.json({ ok: true, orgId, plan: plan.code, subId: sub.id, periodEnd: end });
}
