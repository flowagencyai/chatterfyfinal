# 🛒 STRIPE LIVE MODE SETUP - Chatterfy

## 📋 Checklist de Configuração

### 1. Configuração da Conta Stripe

#### ✅ Pré-requisitos
- [ ] Conta Stripe criada e verificada
- [ ] Informações bancárias adicionadas
- [ ] Verificação de identidade completa
- [ ] Tax ID configurado (se aplicável)

#### ✅ Ativação Live Mode
- [ ] Solicitar ativação do Live Mode no dashboard Stripe
- [ ] Aguardar aprovação (pode levar 1-2 dias úteis)
- [ ] Verificar se Live Mode está ativo

### 2. Criação de Produtos e Preços

#### 🆓 Plano FREE
```bash
# Criar produto FREE
curl https://api.stripe.com/v1/products \
  -u sk_live_your_secret_key: \
  -d name="Chatterfy Free" \
  -d description="Plano gratuito com 2M tokens/mês" \
  -d metadata[plan_code]="FREE"

# Criar preço FREE (R$ 0,00)
curl https://api.stripe.com/v1/prices \
  -u sk_live_your_secret_key: \
  -d product="prod_xxx" \
  -d unit_amount=0 \
  -d currency=brl \
  -d recurring[interval]=month \
  -d metadata[plan_code]="FREE"
```

#### 💎 Plano PRO
```bash
# Criar produto PRO
curl https://api.stripe.com/v1/products \
  -u sk_live_your_secret_key: \
  -d name="Chatterfy Pro" \
  -d description="Plano profissional com 10M tokens/mês" \
  -d metadata[plan_code]="PRO"

# Criar preço PRO (R$ 49,90)
curl https://api.stripe.com/v1/prices \
  -u sk_live_your_secret_key: \
  -d product="prod_yyy" \
  -d unit_amount=4990 \
  -d currency=brl \
  -d recurring[interval]=month \
  -d metadata[plan_code]="PRO"
```

### 3. Configuração de Webhooks

#### 🔗 Endpoint URLs
- **Production**: `https://api.yourdomain.com/webhooks/stripe`
- **Staging**: `https://staging-api.yourdomain.com/webhooks/stripe`

#### 📋 Eventos Necessários
```javascript
[
  'customer.subscription.created',
  'customer.subscription.updated', 
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated',
  'payment_method.attached',
  'setup_intent.succeeded'
]
```

#### 🔐 Webhook Configuration
1. No dashboard Stripe → Developers → Webhooks
2. Add endpoint: `https://api.yourdomain.com/webhooks/stripe`
3. Select events (lista acima)
4. Copy webhook signing secret
5. Add to `.env.production`: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

### 4. Atualização do Database

#### 📝 SQL Script para Atualizar Planos
```sql
-- Atualizar plano FREE com IDs do Stripe Live
UPDATE "Plan" 
SET 
  "stripePriceId" = 'price_xxx_free_live',
  "stripeProductId" = 'prod_xxx_free_live'
WHERE "code" = 'FREE';

-- Atualizar plano PRO com IDs do Stripe Live  
UPDATE "Plan"
SET 
  "stripePriceId" = 'price_yyy_pro_live',
  "stripeProductId" = 'prod_yyy_pro_live'
WHERE "code" = 'PRO';
```

### 5. Configuração de Tax

#### 🇧🇷 Configuração para Brasil
```bash
# Configurar tax rate para Brasil (exemplo: 5% ISS)
curl https://api.stripe.com/v1/tax_rates \
  -u sk_live_your_secret_key: \
  -d display_name="ISS" \
  -d description="Imposto sobre Serviços" \
  -d jurisdiction="BR" \
  -d percentage=5.0 \
  -d inclusive=false
```

### 6. Testing em Live Mode

#### 🧪 Testes Recomendados
- [ ] Criar customer
- [ ] Processar subscription
- [ ] Testar webhook delivery
- [ ] Testar cancelamento
- [ ] Testar reativação
- [ ] Testar upgrade/downgrade

#### 🔍 Monitoramento
- [ ] Configurar alertas no Stripe Dashboard
- [ ] Monitorar logs de webhook
- [ ] Verificar métricas de conversão

### 7. Configuração de Email Templates

#### 📧 Templates Necessários
- [ ] Welcome email (novo customer)
- [ ] Payment succeeded
- [ ] Payment failed
- [ ] Subscription cancelled
- [ ] Trial ending reminder

### 8. Compliance e Segurança

#### ⚖️ Requisitos Legais
- [ ] Política de privacidade atualizada
- [ ] Termos de serviço com billing
- [ ] Política de cancelamento
- [ ] Informações de contato para suporte

#### 🔒 Segurança
- [ ] Webhook signature verification implementada
- [ ] API keys em environment variables
- [ ] Logs de transações seguras
- [ ] Rate limiting em endpoints Stripe

## 🚀 Script de Deploy dos Planos

```javascript
// apps/api/scripts/deploy-stripe-plans.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');

async function deployPlans() {
  const prisma = new PrismaClient();
  
  try {
    // Buscar planos do database
    const plans = await prisma.plan.findMany();
    
    for (const plan of plans) {
      console.log(`🚀 Deploying plan: ${plan.code}`);
      
      // Criar produto no Stripe
      const product = await stripe.products.create({
        name: plan.name,
        description: `${plan.monthlyCreditsTokens} tokens/mês`,
        metadata: { plan_code: plan.code }
      });
      
      // Criar preço no Stripe
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.code === 'FREE' ? 0 : 4990,
        currency: 'brl',
        recurring: { interval: 'month' },
        metadata: { plan_code: plan.code }
      });
      
      // Atualizar database com IDs do Stripe
      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          stripeProductId: product.id,
          stripePriceId: price.id
        }
      });
      
      console.log(`✅ Plan ${plan.code} deployed - Product: ${product.id}, Price: ${price.id}`);
    }
    
  } catch (error) {
    console.error('❌ Error deploying plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deployPlans();
```

## 📊 Métricas a Monitorar

### 💰 Financial KPIs
- MRR (Monthly Recurring Revenue)
- Churn rate
- Customer lifetime value
- Average revenue per user

### 🔄 Conversion Metrics
- Trial to paid conversion
- Free to paid conversion  
- Upgrade rate (FREE → PRO)
- Payment failure rate

### 🎯 Success Metrics
- Active subscriptions
- Revenue growth
- Customer satisfaction
- Support ticket volume

## ⚠️ Alertas Críticos

Configure alertas para:
- [ ] Payment failures > 5%
- [ ] Webhook delivery failures
- [ ] High churn rate (> 10%)
- [ ] Subscription cancellations spike
- [ ] API error rate increase

## 🆘 Rollback Plan

Se algo der errado:
1. **Immediate**: Switch back to test mode
2. **Database**: Restore from backup
3. **Webhooks**: Disable problematic webhooks  
4. **Customer Communication**: Notify affected users
5. **Support**: Prepare response scripts

---

**⚡ Action Items:**
1. Ativar Live Mode no Stripe
2. Executar scripts de criação de produtos
3. Configurar webhooks de produção
4. Testar fluxo completo end-to-end
5. Monitorar primeiras 48h closely