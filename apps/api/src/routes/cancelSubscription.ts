import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { stripe } from '../util/stripe';

/**
 * POST /v1/user/cancel-subscription - Cancela a assinatura do usuário
 * Body: { reason?: string, when: 'now' | 'end_of_cycle' }
 */
export async function routeCancelSubscription(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { reason = 'User requested cancellation', when = 'end_of_cycle' } = req.body;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    if (!['now', 'end_of_cycle'].includes(when)) {
      return res.status(400).json({ error: 'Invalid cancellation timing' });
    }

    // Buscar assinatura ativa
    const subscription = await prisma.subscription.findFirst({
      where: {
        orgId,
        active: true,
        stripeSubscriptionId: { not: null }
      },
      include: { plan: true }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe integration not available' });
    }

    // Verificar se já está cancelada
    if (subscription.cancelAtPeriodEnd) {
      return res.status(400).json({ 
        error: 'Subscription is already scheduled for cancellation',
        currentStatus: {
          cancelAtPeriodEnd: true,
          cancelledAt: subscription.cancelledAt,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
    }

    const now = new Date();
    let stripeUpdate: any;

    if (when === 'now') {
      // Cancelamento imediato
      stripeUpdate = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          active: false,
          cancelAtPeriodEnd: false,
          cancelledAt: now,
          cancellationReason: reason,
          stripeStatus: 'canceled'
        }
      });

    } else {
      // Cancelar no final do período
      stripeUpdate = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason,
          cancelled_by: 'user'
        }
      });

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
          cancelledAt: now,
          cancellationReason: reason,
          stripeStatus: 'active' // Still active until period end
        }
      });
    }

    // Log para analytics
    console.log(`🚫 [SUBSCRIPTION] Cancelamento solicitado - Org: ${orgId}, When: ${when}, Reason: ${reason}`);

    res.json({
      success: true,
      message: when === 'now' 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will be cancelled at the end of current period',
      cancellation: {
        when,
        cancelledAt: now,
        reason,
        accessUntil: when === 'now' ? now : subscription.currentPeriodEnd || subscription.periodEnd,
        canReactivate: when === 'end_of_cycle'
      },
      stripe: {
        subscriptionId: subscription.stripeSubscriptionId,
        status: stripeUpdate.status,
        cancelAtPeriodEnd: stripeUpdate.cancel_at_period_end
      }
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}