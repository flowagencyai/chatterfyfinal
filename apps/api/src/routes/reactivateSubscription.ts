import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { stripe } from '../util/stripe';

/**
 * POST /v1/user/reactivate-subscription - Reativa assinatura cancelada
 */
export async function routeReactivateSubscription(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Buscar assinatura cancelada (mas ainda ativa até fim do período)
    const subscription = await prisma.subscription.findFirst({
      where: {
        orgId,
        active: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: { not: null }
      },
      include: { plan: true }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ 
        error: 'No cancelled subscription found that can be reactivated' 
      });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe integration not available' });
    }

    // Verificar se ainda está dentro do período
    const now = new Date();
    const periodEnd = subscription.currentPeriodEnd || subscription.periodEnd;
    
    if (now > periodEnd) {
      return res.status(400).json({
        error: 'Subscription has already expired and cannot be reactivated',
        expiredAt: periodEnd
      });
    }

    // Reativar no Stripe
    const stripeUpdate = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
      metadata: {
        reactivated_at: now.toISOString(),
        reactivated_by: 'user'
      }
    });

    // Atualizar no banco
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        cancellationReason: null,
        stripeStatus: 'active'
      }
    });

    // Log para analytics
    console.log(`✅ [SUBSCRIPTION] Reativação bem-sucedida - Org: ${orgId}`);

    res.json({
      success: true,
      message: 'Subscription successfully reactivated',
      subscription: {
        id: subscription.id,
        plan: subscription.plan.name,
        status: 'active',
        currentPeriodEnd: subscription.currentPeriodEnd || subscription.periodEnd,
        reactivatedAt: now
      },
      stripe: {
        subscriptionId: subscription.stripeSubscriptionId,
        status: stripeUpdate.status,
        cancelAtPeriodEnd: stripeUpdate.cancel_at_period_end
      }
    });

  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ 
      error: 'Failed to reactivate subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}