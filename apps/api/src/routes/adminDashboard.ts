import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function adminDashboard(req: Request, res: Response) {
  try {
    // Métricas principais de negócio
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Usuários e Organizações
    const totalUsers = await prisma.user.count();
    const totalOrgs = await prisma.organization.count();
    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const newOrgsThisMonth = await prisma.organization.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // 2. Assinaturas e Receita
    const activeSubscriptions = await prisma.subscription.count({
      where: { active: true }
    });
    
    const cancelledSubscriptions = await prisma.subscription.count({
      where: { cancelAtPeriodEnd: true }
    });

    // 3. Usage Analytics
    const totalTokensUsed = await prisma.usage.aggregate({
      _sum: { total_tokens: true },
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const totalCostEstimate = await prisma.usage.aggregate({
      _sum: { cost_usd: true },
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // 4. Distribuição por Planos
    const planDistribution = await prisma.subscription.groupBy({
      by: ['planId'],
      _count: { planId: true },
      where: { active: true }
    });

    // 5. API Calls nos últimos 30 dias
    const apiCallsThisMonth = await prisma.usage.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const apiCallsLastMonth = await prisma.usage.count({
      where: { 
        createdAt: { 
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo 
        } 
      }
    });

    // 6. Top Organizations by Usage
    const topOrgsByUsage = await prisma.usage.groupBy({
      by: ['orgId'],
      _sum: { total_tokens: true },
      _count: { id: true },
      orderBy: { _sum: { total_tokens: 'desc' } },
      take: 10,
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // 7. Growth Metrics
    const usersLastMonth = await prisma.user.count({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });
    
    const userGrowthRate = usersLastMonth > 0 
      ? ((newUsersThisMonth / usersLastMonth) * 100)
      : 0;

    // 8. Churn Rate (aproximado)
    const churnRate = activeSubscriptions > 0 
      ? ((cancelledSubscriptions / activeSubscriptions) * 100)
      : 0;

    // 9. Recent Activity
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        org: {
          include: {
            subscriptions: {
              include: { plan: true }
            }
          }
        }
      }
    });

    const recentUsage = await prisma.usage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // 10. System Health - Simplificado
    const callsGrowth = apiCallsLastMonth > 0 
      ? ((apiCallsThisMonth - apiCallsLastMonth) / apiCallsLastMonth * 100)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrgs,
          activeSubscriptions,
          newUsersThisMonth,
          newOrgsThisMonth,
          userGrowthRate: Math.round(userGrowthRate * 100) / 100,
          churnRate: Math.round(churnRate * 100) / 100
        },
        revenue: {
          activeSubscriptions,
          cancelledSubscriptions,
          // TODO: Integrar com Stripe para MRR real
          estimatedMRR: activeSubscriptions * 49.90, // Placeholder
        },
        usage: {
          totalTokensThisMonth: totalTokensUsed._sum.total_tokens || 0,
          totalCostThisMonth: totalCostEstimate._sum.cost_usd || 0,
          apiCallsThisMonth,
          apiCallsLastMonth,
          callsGrowth
        },
        distribution: {
          planDistribution: planDistribution.map(p => ({
            planId: p.planId,
            count: p._count.planId
          })),
          topOrgsByUsage: topOrgsByUsage.map(org => ({
            orgId: org.orgId,
            totalTokens: org._sum.total_tokens || 0,
            apiCalls: org._count.id
          }))
        },
        recent: {
          users: recentUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            organization: user.org?.name,
            plan: user.org?.subscriptions?.[0]?.plan?.name || 'FREE'
          })),
          usage: recentUsage.map(usage => ({
            id: usage.id,
            orgId: usage.orgId,
            orgName: 'N/A', // Removido join com organization
            totalTokens: usage.total_tokens,
            costUsd: usage.cost_usd,
            createdAt: usage.createdAt
          }))
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}