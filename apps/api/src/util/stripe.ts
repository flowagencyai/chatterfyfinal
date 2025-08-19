import Stripe from 'stripe';

// Initialize Stripe only if API key is provided
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('...')) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
} else {
  console.warn('⚠️ [STRIPE] Not initialized - missing or placeholder API key');
}

export { stripe };

// Stripe webhook signature verification
export function verifyWebhookSignature(body: string, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
}

// Helper to create or retrieve Stripe customer
export async function ensureStripeCustomer(orgId: string, email: string, name?: string) {
  const prisma = await import('../db/prisma').then(m => m.default);
  
  // Check if org already has a Stripe customer
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { stripeCustomerId: true }
  });

  if (org?.stripeCustomerId) {
    return org.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      orgId
    }
  });

  // Update organization with Stripe customer ID
  await prisma.organization.update({
    where: { id: orgId },
    data: { stripeCustomerId: customer.id }
  });

  return customer.id;
}