import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from './middleware/rateLimit';
import { routeChatCompletions } from './routes/chatCompletions';
import { tenant } from './middleware/tenant';
import { orgUserRateLimit } from './middleware/orgUserRateLimit';
import { routeEmbeddings } from './routes/embeddings';
import { routeAdminUsage } from './routes/adminUsage';

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

// Tenant & Rate limits
app.use(tenant);
app.use(rateLimit);
app.use(orgUserRateLimit);

app.post('/v1/chat/completions', planGuard, routeChatCompletions);
app.post('/v1/embeddings', planGuard, routeEmbeddings);
app.get('/admin/usage', routeAdminUsage);
app.post('/v1/files', planGuard, routeUpload);
app.post('/v1/files/presign', planGuard, routePresign);
app.post('/v1/files/confirm', planGuard, routeConfirmUpload);
app.post('/admin/set-plan', routeAdminSetPlan);
app.get('/v1/files/:id', routeGetFile);
app.post('/admin/seed-plans', routeAdminSeedPlans);

const port = Number(process.env.API_PORT || 8787);
app.listen(port, () => {
  console.log(`[api] listening on :${port}`);
});
