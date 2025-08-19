import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { verifyWebhookSignature } from '../util/stripe';
import Stripe from 'stripe';

/**
 * POST /stripe/webhook - Handle Stripe webhook events
 * IMPORTANT: This endpoint needs raw body, not JSON parsed
 */
export async function routeStripeWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const body = req.body; // Raw body needed for signature verification

    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body.toString(), signature);
    } catch (error) {
      console.error('⚠️ [STRIPE WEBHOOK] Signature verification failed:', error);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log(`🔔 [STRIPE WEBHOOK] Received event: ${event.type} (${event.id})`);

    // Check if event already processed (idempotency)
    const existingEvent = await prisma.stripeWebhook.findUnique({
      where: { stripeEventId: event.id }
    });

    if (existingEvent?.processed) {
      console.log(`✅ [STRIPE WEBHOOK] Event ${event.id} already processed`);
      return res.json({ received: true, status: 'already_processed' });
    }

    // Store event for processing
    await prisma.stripeWebhook.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        data: JSON.stringify(event.data),
        processed: false
      }
    });

    // Process event based on type
    let processed = false;
    let error: string | null = null;

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          processed = true;
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          processed = true;
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          processed = true;
          break;

        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          processed = true;
          break;

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          processed = true;
          break;

        default:
          console.log(`ℹ️ [STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
          processed = true; // Mark as processed to avoid retries
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ [STRIPE WEBHOOK] Error processing ${event.type}:`, err);
    }

    // Update event processing status
    await prisma.stripeWebhook.update({
      where: { stripeEventId: event.id },
      data: {
        processed,
        processedAt: processed ? new Date() : null,
        error
      }
    });

    if (!processed) {
      return res.status(500).json({ error: 'Failed to process webhook' });
    }

    res.json({ received: true, status: 'processed' });

  } catch (error) {
    console.error('❌ [STRIPE WEBHOOK] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Event handlers
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`🆕 [STRIPE] Subscription created: ${subscription.id}`);
  
  const orgId = subscription.metadata?.orgId;
  if (!orgId) {
    throw new Error('No orgId in subscription metadata');
  }

  // Get plan from Stripe price ID
  const stripePriceId = subscription.items.data[0]?.price.id;
  const plan = await prisma.plan.findFirst({
    where: { stripePriceId }
  });

  if (!plan) {
    throw new Error(`No plan found for Stripe price ID: ${stripePriceId}`);
  }

  // Update existing subscription or create new one
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      orgId,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0]?.price.id,
      stripeStatus: subscription.status,
      active: subscription.status === 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      periodStart: new Date(subscription.current_period_start * 1000),
      periodEnd: new Date(subscription.current_period_end * 1000)
    },
    update: {
      stripeStatus: subscription.status,
      active: subscription.status === 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`🔄 [STRIPE] Subscription updated: ${subscription.id}`);

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      stripeStatus: subscription.status,
      active: subscription.status === 'active',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`🗑️ [STRIPE] Subscription deleted: ${subscription.id}`);

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      active: false,
      stripeStatus: 'canceled',
      cancelledAt: new Date()
    }
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`💰 [STRIPE] Payment succeeded for subscription: ${invoice.subscription}`);
  // Log successful payment, update billing info if needed
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`💸 [STRIPE] Payment failed for subscription: ${invoice.subscription}`);
  
  if (invoice.subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: {
        stripeStatus: 'past_due'
      }
    });
  }
}