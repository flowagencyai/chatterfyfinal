# 📊 MONITORING & OBSERVABILITY - Chatterfy

## 🎯 Stack de Monitoring Recomendado

### 💰 Custo Total: ~$50/mês
- **Sentry**: $26/mês (20k errors)
- **UptimeRobot**: Grátis (50 monitors)
- **Vercel Analytics**: Grátis 
- **LogRocket**: $39/mês (1k sessions)

## 🚨 1. Error Tracking - Sentry

### Setup Básico
```bash
# 1. Criar conta em sentry.io
# 2. Criar projeto "Chatterfy"
# 3. Copiar DSN
```

### API Implementation
```javascript
// apps/api/src/utils/sentry.js
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 0.1,
})

// Error handler middleware
export const sentryErrorHandler = (error, req, res, next) => {
  Sentry.captureException(error, {
    tags: {
      component: 'api',
      endpoint: req.path,
      method: req.method,
    },
    extra: {
      body: req.body,
      query: req.query,
      headers: req.headers,
    }
  })
  
  res.status(500).json({ error: 'Internal Server Error' })
}
```

### Frontend Implementation
```javascript
// apps/web/app/utils/sentry.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
})

// Error boundary
export const withSentry = (Component) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => (
      <div className="error-boundary">
        <h2>Algo deu errado</h2>
        <button onClick={resetError}>Tentar novamente</button>
      </div>
    )
  })
}
```

## 📈 2. Application Performance - Custom Metrics

### Performance Middleware
```javascript
// apps/api/src/middleware/metrics.js
import { performance } from 'perf_hooks'

export const metricsMiddleware = (req, res, next) => {
  const start = performance.now()
  
  // Track request
  const originalSend = res.send
  res.send = function(...args) {
    const duration = performance.now() - start
    
    // Log metrics
    logMetric({
      type: 'api_request',
      endpoint: req.path,
      method: req.method,
      duration,
      status: res.statusCode,
      timestamp: new Date().toISOString()
    })
    
    // Track slow requests
    if (duration > 5000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${duration}ms`)
    }
    
    return originalSend.apply(this, args)
  }
  
  next()
}

const logMetric = async (metric) => {
  // Send to your preferred analytics service
  // Or store in database for later analysis
  await prisma.metric.create({ data: metric })
}
```

### Chat Performance Tracking
```javascript
// apps/web/app/utils/performance.js
export const trackChatMetrics = {
  messageStart: (messageId) => {
    performance.mark(`message-start-${messageId}`)
  },
  
  messageEnd: (messageId, provider, model) => {
    performance.mark(`message-end-${messageId}`)
    performance.measure(
      `message-duration-${messageId}`,
      `message-start-${messageId}`,
      `message-end-${messageId}`
    )
    
    const measure = performance.getEntriesByName(`message-duration-${messageId}`)[0]
    
    // Track to analytics
    if (window.gtag) {
      gtag('event', 'chat_response_time', {
        event_category: 'performance',
        event_label: `${provider}-${model}`,
        value: Math.round(measure.duration)
      })
    }
  }
}
```

## 🔍 3. Uptime Monitoring - UptimeRobot

### Endpoints to Monitor
```bash
# Critical endpoints
https://yourdomain.com/                    # Homepage
https://yourdomain.com/api/health          # Frontend health
https://api.yourdomain.com/health          # API health
https://api.yourdomain.com/v1/chat/completions  # Chat API

# Database connectivity
https://api.yourdomain.com/admin/health/db

# External dependencies
https://api.yourdomain.com/admin/health/stripe
https://api.yourdomain.com/admin/health/s3
```

### Health Check Endpoints
```javascript
// apps/api/src/routes/health.js
import { PrismaClient } from '@prisma/client'
import AWS from 'aws-sdk'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const s3 = new AWS.S3()

export const healthCheck = async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  }
  
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`
    checks.checks.database = 'healthy'
  } catch (error) {
    checks.checks.database = 'unhealthy'
    checks.status = 'unhealthy'
  }
  
  try {
    // Stripe check
    await stripe.accounts.retrieve()
    checks.checks.stripe = 'healthy'
  } catch (error) {
    checks.checks.stripe = 'unhealthy'
  }
  
  try {
    // S3 check
    await s3.listBuckets().promise()
    checks.checks.s3 = 'healthy'
  } catch (error) {
    checks.checks.s3 = 'unhealthy'
  }
  
  // Memory usage
  const memUsage = process.memoryUsage()
  checks.checks.memory = {
    usage: Math.round(memUsage.heapUsed / 1024 / 1024),
    limit: Math.round(memUsage.heapTotal / 1024 / 1024)
  }
  
  const status = checks.status === 'healthy' ? 200 : 503
  res.status(status).json(checks)
}
```

## 📊 4. Business Metrics Dashboard

### Key Metrics to Track
```javascript
// apps/api/src/utils/business-metrics.js
export const trackBusinessMetrics = {
  // User metrics
  newSignup: async (userId, source = 'direct') => {
    await logEvent('user_signup', { userId, source })
  },
  
  // Subscription metrics
  subscriptionCreated: async (orgId, planCode, amount) => {
    await logEvent('subscription_created', { orgId, planCode, amount })
  },
  
  subscriptionCancelled: async (orgId, reason) => {
    await logEvent('subscription_cancelled', { orgId, reason })
  },
  
  // Usage metrics
  chatMessage: async (orgId, provider, model, tokens) => {
    await logEvent('chat_message', { orgId, provider, model, tokens })
  },
  
  fileUpload: async (orgId, fileSize, fileType) => {
    await logEvent('file_upload', { orgId, fileSize, fileType })
  }
}

const logEvent = async (eventType, data) => {
  await prisma.businessEvent.create({
    data: {
      eventType,
      data: JSON.stringify(data),
      timestamp: new Date()
    }
  })
}
```

### Daily Metrics Aggregation
```javascript
// apps/api/src/scripts/aggregate-daily-metrics.js
const aggregateDailyMetrics = async () => {
  const today = new Date().toISOString().split('T')[0]
  
  // User metrics
  const newUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(today),
        lt: new Date(today + 'T23:59:59.999Z')
      }
    }
  })
  
  // Revenue metrics
  const dailyRevenue = await prisma.usage.aggregate({
    where: { day: new Date(today) },
    _sum: { cost_usd: true }
  })
  
  // Usage metrics
  const totalMessages = await prisma.message.count({
    where: {
      createdAt: {
        gte: new Date(today),
        lt: new Date(today + 'T23:59:59.999Z')
      }
    }
  })
  
  // Store aggregated data
  await prisma.dailyMetrics.upsert({
    where: { date: today },
    create: {
      date: today,
      newUsers,
      revenue: dailyRevenue._sum.cost_usd || 0,
      totalMessages,
      activeOrgs: await getActiveOrgs(today)
    },
    update: {
      newUsers,
      revenue: dailyRevenue._sum.cost_usd || 0,
      totalMessages
    }
  })
}

// Executar diariamente via cron
```

## 🚨 5. Alert System

### Critical Alerts Configuration
```javascript
// apps/api/src/utils/alerts.js
export const sendAlert = async (type, message, severity = 'medium') => {
  const alert = {
    type,
    message,
    severity,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }
  
  // Send to Slack
  if (process.env.SLACK_WEBHOOK) {
    await fetch(process.env.SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 ${severity.toUpperCase()}: ${message}`,
        attachments: [{
          color: severity === 'high' ? 'danger' : 'warning',
          fields: [
            { title: 'Type', value: type, short: true },
            { title: 'Environment', value: process.env.NODE_ENV, short: true }
          ]
        }]
      })
    })
  }
  
  // Send to email for critical alerts
  if (severity === 'high' && process.env.ALERT_EMAIL) {
    await sendEmailAlert(alert)
  }
  
  // Log to Sentry
  Sentry.captureMessage(message, severity)
}

// Auto-monitoring
export const monitorSystem = async () => {
  // Check error rate
  const errorCount = await getErrorCount(5) // last 5 minutes
  if (errorCount > 10) {
    await sendAlert('high_error_rate', `${errorCount} errors in last 5 minutes`, 'high')
  }
  
  // Check response time
  const avgResponseTime = await getAvgResponseTime(5)
  if (avgResponseTime > 5000) {
    await sendAlert('slow_response', `Avg response time: ${avgResponseTime}ms`, 'medium')
  }
  
  // Check subscription cancellations
  const cancellations = await getCancellationCount(60) // last hour
  if (cancellations > 5) {
    await sendAlert('high_churn', `${cancellations} cancellations in last hour`, 'high')
  }
}
```

## 📱 6. Frontend Analytics - Vercel Analytics + PostHog

### Vercel Analytics Setup
```javascript
// apps/web/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### PostHog Event Tracking
```javascript
// apps/web/app/utils/analytics.js
import { PostHog } from 'posthog-js'

if (typeof window !== 'undefined') {
  PostHog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com'
  })
}

export const analytics = {
  track: (event, properties = {}) => {
    if (typeof window !== 'undefined') {
      PostHog.capture(event, properties)
    }
  },
  
  identify: (userId, traits = {}) => {
    if (typeof window !== 'undefined') {
      PostHog.identify(userId, traits)
    }
  },
  
  // Custom events
  chatMessageSent: (provider, model) => {
    analytics.track('chat_message_sent', { provider, model })
  },
  
  subscriptionUpgrade: (fromPlan, toPlan) => {
    analytics.track('subscription_upgrade', { fromPlan, toPlan })
  },
  
  fileUploaded: (fileType, fileSize) => {
    analytics.track('file_uploaded', { fileType, fileSize })
  }
}
```

## 🔧 7. Deployment Scripts

### Production Deploy with Monitoring
```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "🚀 Starting production deployment..."

# Pre-deploy checks
./scripts/pre-deploy-checks.sh

# Deploy
docker-compose -f docker-compose.yml up -d

# Wait for services
sleep 30

# Health checks
./scripts/health-check.sh

# Send deployment notification
curl -X POST $SLACK_WEBHOOK -d '{
  "text": "🚀 Chatterfy deployed to production successfully",
  "attachments": [{
    "color": "good",
    "fields": [
      {"title": "Environment", "value": "Production", "short": true},
      {"title": "Version", "value": "'$(git rev-parse --short HEAD)'", "short": true}
    ]
  }]
}'

echo "✅ Deployment completed successfully!"
```

### Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh

# Check API health
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/health)
if [ $API_HEALTH != "200" ]; then
  echo "❌ API health check failed"
  exit 1
fi

# Check frontend health
WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/api/health)
if [ $WEB_HEALTH != "200" ]; then
  echo "❌ Frontend health check failed"
  exit 1
fi

# Check database connectivity
DB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/admin/health/db)
if [ $DB_HEALTH != "200" ]; then
  echo "❌ Database health check failed"
  exit 1
fi

echo "✅ All health checks passed"
```

## 📊 8. Dashboard Setup

### Grafana Dashboard (Optional)
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  grafana_data:
```

## ✅ Monitoring Checklist

### Phase 1: Basic Monitoring
- [ ] Sentry error tracking configurado
- [ ] UptimeRobot monitors ativos
- [ ] Health check endpoints implementados
- [ ] Basic performance logging
- [ ] Slack alerts configurados

### Phase 2: Advanced Analytics
- [ ] PostHog event tracking
- [ ] Business metrics dashboard
- [ ] Daily metrics aggregation
- [ ] Custom alert rules
- [ ] Performance optimization

### Phase 3: Deep Observability
- [ ] Grafana dashboard (opcional)
- [ ] Log aggregation (ELK stack)
- [ ] Distributed tracing
- [ ] Custom metrics API
- [ ] Automated reporting

---

**🎯 Objetivos de Performance:**
- Response time < 2s (p95)
- Error rate < 0.1%
- Uptime > 99.9%
- Time to detect issues < 2min
- Time to resolve critical issues < 30min