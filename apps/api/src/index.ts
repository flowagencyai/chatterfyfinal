import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from './middleware/rateLimit';
import { routeChatCompletions } from './routes/chatCompletions';
import { routeAnonymousChatCompletions } from './routes/anonymousChatCompletions';
import { tenant } from './middleware/tenant';
import { orgUserRateLimit } from './middleware/orgUserRateLimit';
import { routeEmbeddings } from './routes/embeddings';
import { routeAdminUsage } from './routes/adminUsage';
import { routeAdminSeedPlans } from './routes/adminSeedPlans';
import { routeAdminSetPlan } from './routes/adminSetPlan';
import { routeGetPlans } from './routes/getPlans';
import { routeGetUserPlan } from './routes/getUserPlan';
import { routeGetUserProfile } from './routes/getUserProfile';
import { routeUpdateUserProfile } from './routes/updateUserProfile';
import { routeUpgradePlan } from './routes/upgradePlan';
import { routeCancelSubscription } from './routes/cancelSubscription';
import { routeReactivateSubscription } from './routes/reactivateSubscription';
import { routeSubscriptionDetails } from './routes/subscriptionDetails';
import { routeStripeWebhook } from './routes/stripeWebhook';
import { routeBillingPortal } from './routes/billingPortal';
import { routeGenerateApiKey } from './routes/generateApiKey';
import { routeRegenerateApiKey } from './routes/regenerateApiKey';
import { adminDashboard } from './routes/adminDashboard';
import { adminGetOrganizations, adminUpdateOrganization, adminDeleteOrganization } from './routes/adminOrganizations';
import { adminStripeMetrics, adminSubscriptionActions } from './routes/adminStripeIntegration';
import { adminAuth } from './middleware/adminAuth';
import { planGuard } from './middleware/planGuard';
import { planGuardWithAnonymous } from './middleware/planGuardWithAnonymous';

const app = express();
app.use(express.json({ limit: '2mb' }));

const allowed = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:3000'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  }
}));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Stripe webhook (needs raw body, before JSON parsing)
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), routeStripeWebhook);

// Anonymous chat route (no auth required)
app.post('/v1/anonymous/chat/completions', routeAnonymousChatCompletions);

// Tenant & Rate limits for authenticated routes
app.use(tenant);
app.use(rateLimit);
app.use(orgUserRateLimit);

// Authenticated routes with plan protection (including anonymous support)
app.post('/v1/chat/completions', planGuardWithAnonymous, routeChatCompletions);
app.post('/v1/embeddings', planGuard, routeEmbeddings);

// Plan management routes
app.get('/v1/plans', routeGetPlans);
app.get('/v1/user/plan', routeGetUserPlan);
app.get('/v1/user/profile', routeGetUserProfile);
app.put('/v1/user/profile', routeUpdateUserProfile);
app.post('/v1/user/upgrade', routeUpgradePlan);

// Subscription management routes (Stripe-powered)
app.get('/v1/user/subscription-detailed', routeSubscriptionDetails);
app.post('/v1/user/cancel-subscription', routeCancelSubscription);
app.post('/v1/user/reactivate-subscription', routeReactivateSubscription);
app.post('/v1/user/billing-portal', routeBillingPortal);

// API Key management routes
app.post('/v1/user/generate-api-key', routeGenerateApiKey);
app.post('/v1/user/regenerate-api-key', routeRegenerateApiKey);

// Admin routes - basic (no auth required for testing)
app.get('/admin/usage', routeAdminUsage);
app.post('/admin/seed-plans', routeAdminSeedPlans);
app.post('/admin/set-plan', routeAdminSetPlan);

// Admin Dashboard routes - protected with admin auth
app.get('/admin/dashboard', adminAuth, adminDashboard);
app.get('/admin/organizations', adminAuth, adminGetOrganizations);
app.put('/admin/organizations/:orgId', adminAuth, adminUpdateOrganization);
app.delete('/admin/organizations/:orgId', adminAuth, adminDeleteOrganization);
app.get('/admin/stripe-metrics', adminAuth, adminStripeMetrics);
app.post('/admin/subscription-actions', adminAuth, adminSubscriptionActions);

const port = Number(process.env.API_PORT || 8787);
app.listen(port, () => {
  console.log(`[api] listening on :${port}`);
});