import { Request, Response } from 'express';
import prisma from '../db/prisma';

/**
 * GET /v1/user/profile - Retorna dados completos do usuário para o Settings
 */
export async function routeGetUserProfile(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!orgId || !userId) {
      return res.status(400).json({ error: 'Organization ID and User ID required' });
    }

    // Buscar usuário completo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        org: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Buscar assinatura ativa da organização
    const subscription = await prisma.subscription.findFirst({
      where: {
        orgId,
        active: true
      },
      include: {
        plan: true
      }
    });

    // Se não tem assinatura ativa, buscar plano FREE como padrão
    let currentPlan = subscription?.plan;
    if (!currentPlan) {
      currentPlan = await prisma.plan.findUnique({ 
        where: { code: 'FREE' } 
      });
    }

    if (!currentPlan) {
      return res.status(500).json({ error: 'No default plan configured' });
    }

    // Calcular período atual (mês/ano)
    const currentDate = new Date();
    const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Buscar estatísticas de uso do mês atual
    const usageStats = await prisma.usage.aggregate({
      where: {
        orgId,
        day: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      _sum: {
        total_tokens: true
      },
      _count: {
        id: true
      }
    });

    // Buscar threads/conversas do mês atual
    const threadsCount = await prisma.thread.count({
      where: {
        orgId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    // Buscar total de threads da organização
    const totalThreads = await prisma.thread.count({
      where: { orgId }
    });

    // Calcular próxima cobrança (se tem assinatura ativa)
    let nextBilling = null;
    if (subscription && subscription.currentPeriodEnd) {
      nextBilling = subscription.currentPeriodEnd;
    } else if (subscription) {
      // Se não tem currentPeriodEnd, calcular próximo mês
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextBilling = nextMonth;
    }

    // Buscar método de pagamento (se tem Stripe subscription)
    let paymentMethod = null;
    if (subscription?.stripeSubscriptionId) {
      paymentMethod = {
        type: 'card',
        last4: '4532', // Em produção, buscar do Stripe
        brand: 'visa'
      };
    }

    // Preparar resposta
    const profile = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt
      },
      organization: {
        id: user.org.id,
        name: user.org.name,
        createdAt: user.org.createdAt,
        apiKey: user.org.apiKey,
        apiKeyCreatedAt: user.org.apiKeyCreatedAt
      },
      plan: {
        code: currentPlan.code,
        name: currentPlan.name,
        monthlyCreditsTokens: currentPlan.monthlyCreditsTokens,
        dailyTokenLimit: currentPlan.dailyTokenLimit,
        storageLimitMB: currentPlan.storageLimitMB,
        maxFileSizeMB: currentPlan.maxFileSizeMB,
        features: JSON.parse(currentPlan.features),
        stripePriceId: currentPlan.stripePriceId,
        stripeProductId: currentPlan.stripeProductId
      },
      subscription: subscription ? {
        id: subscription.id,
        active: subscription.active,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeStatus: subscription.stripeStatus,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        nextBilling,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt
      } : null,
      usage: {
        currentPeriod: {
          start: periodStart,
          end: periodEnd,
          totalTokens: usageStats._sum.total_tokens || 0,
          totalRequests: usageStats._count.id || 0,
          threadsCreated: threadsCount
        },
        totalThreads,
        accountSince: user.createdAt
      },
      billing: {
        paymentMethod,
        nextBilling,
        amount: currentPlan.code === 'FREE' ? 0 : 4990, // R$ 49.90 em centavos
        currency: 'BRL'
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}