# 📧 EMAIL PRODUCTION SETUP - Chatterfy

## 🎯 Provedor Recomendado: SendGrid

### 💰 Custo-Benefício
- **40.000 emails/mês**: ~$15/mês
- **Delivery rate**: >99%
- **Setup**: Simples e rápido
- **API**: Bem documentada

## 🚀 Setup SendGrid

### 1. Criar Conta e API Key
```bash
# 1. Acesse: https://sendgrid.com/
# 2. Crie conta gratuita (100 emails/dia)
# 3. Vá para Settings → API Keys
# 4. Create API Key com "Full Access"
# 5. Copie a API key (começa com SG.)
```

### 2. Configurar Domain Authentication
```bash
# No SendGrid Dashboard:
# 1. Settings → Sender Authentication
# 2. Authenticate Your Domain
# 3. Add DNS records ao seu domínio:

# DNS Records a adicionar:
CNAME s1._domainkey.yourdomain.com → s1.domainkey.u123456.wl.sendgrid.net
CNAME s2._domainkey.yourdomain.com → s2.domainkey.u123456.wl.sendgrid.net
CNAME em1234.yourdomain.com → u123456.wl.sendgrid.net

# 4. Verify DNS propagation
# 5. Click "Verify" no SendGrid
```

### 3. Environment Variables
```bash
# .env.production
EMAIL_SERVER=smtp://apikey:SG.your_sendgrid_api_key@smtp.sendgrid.net:587
EMAIL_FROM="Chatterfy <noreply@yourdomain.com>"
```

## 📧 Templates de Email

### 1. Welcome Email Template
```html
<!-- apps/web/app/templates/welcome.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bem-vindo ao Chatterfy!</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Bem-vindo ao Chatterfy!</h1>
        </div>
        <div class="content">
            <p>Olá {{name}},</p>
            <p>Obrigado por se juntar ao Chatterfy! Sua conta foi criada com sucesso.</p>
            
            <h3>🚀 O que fazer agora:</h3>
            <ul>
                <li>Faça seu primeiro chat com IA</li>
                <li>Explore os diferentes modelos disponíveis</li>
                <li>Faça upload de arquivos para análise</li>
                <li>Configure suas preferências</li>
            </ul>
            
            <a href="{{loginUrl}}" class="button">Acessar Chatterfy</a>
            
            <p>Se precisar de ajuda, nossa equipe está sempre disponível!</p>
            
            <p>Atenciosamente,<br>Equipe Chatterfy</p>
        </div>
        <div class="footer">
            <p>© 2025 Chatterfy. Todos os direitos reservados.</p>
            <p>Se não deseja mais receber emails, <a href="{{unsubscribeUrl}}">clique aqui</a>.</p>
        </div>
    </div>
</body>
</html>
```

### 2. Magic Link Template
```html
<!-- apps/web/app/templates/magic-link.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Seu link de acesso - Chatterfy</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 40px 30px; text-align: center; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .security { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Acesso ao Chatterfy</h1>
        </div>
        <div class="content">
            <h2>Clique para fazer login</h2>
            <p>Use o botão abaixo para acessar sua conta no Chatterfy de forma segura:</p>
            
            <a href="{{url}}" class="button">Acessar Minha Conta</a>
            
            <div class="security">
                <p><strong>🔒 Segurança:</strong> Este link é válido por 1 hora e pode ser usado apenas uma vez.</p>
            </div>
            
            <p><small>Se você não solicitou este acesso, pode ignorar este email com segurança.</small></p>
        </div>
        <div class="footer">
            <p>© 2025 Chatterfy | Este email foi enviado para {{email}}</p>
        </div>
    </div>
</body>
</html>
```

### 3. Payment Success Template
```html
<!-- apps/web/app/templates/payment-success.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pagamento confirmado - Chatterfy</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
        </div>
        <div class="content">
            <p>Olá {{customerName}},</p>
            
            <p>Seu pagamento foi processado com sucesso!</p>
            
            <h3>📋 Detalhes da cobrança:</h3>
            <ul>
                <li><strong>Plano:</strong> {{planName}}</li>
                <li><strong>Valor:</strong> {{amount}}</li>
                <li><strong>Método:</strong> {{paymentMethod}}</li>
                <li><strong>Próxima cobrança:</strong> {{nextBilling}}</li>
            </ul>
            
            <a href="{{dashboardUrl}}" class="button">Acessar Dashboard</a>
            
            <p>Sua conta PRO está ativa e você já pode usar todos os recursos!</p>
        </div>
    </div>
</body>
</html>
```

## 🔧 Implementação no NextAuth

### Configurar Custom Email Provider
```javascript
// apps/web/app/api/auth/[...nextauth]/route.ts
import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { readFileSync } from 'fs'
import { join } from 'path'

export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const templatePath = join(process.cwd(), 'app/templates/magic-link.html')
        const template = readFileSync(templatePath, 'utf8')
        
        const html = template
          .replace(/{{url}}/g, url)
          .replace(/{{email}}/g, email)
        
        await fetch('https://api.sendgrid.v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: 'noreply@yourdomain.com', name: 'Chatterfy' },
            subject: 'Seu link de acesso - Chatterfy',
            content: [{ type: 'text/html', value: html }]
          })
        })
      }
    })
  ],
  // ... resto da configuração
}
```

## 📊 Email Analytics

### 1. Tracking de Engagement
```javascript
// apps/api/src/utils/email-tracking.js
const trackEmailEvent = async (event, email, metadata = {}) => {
  await prisma.emailEvent.create({
    data: {
      event, // 'sent', 'delivered', 'opened', 'clicked'
      email,
      metadata,
      timestamp: new Date()
    }
  })
}
```

### 2. Unsubscribe Handling
```javascript
// apps/web/app/unsubscribe/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')
  
  // Verificar token
  // Adicionar email à lista de unsubscribe
  // Retornar página de confirmação
}
```

## 🚨 Monitoring & Alerts

### 1. Email Delivery Monitoring
```javascript
// Webhook do SendGrid para tracking
app.post('/webhooks/sendgrid', (req, res) => {
  const events = req.body
  
  events.forEach(event => {
    switch(event.event) {
      case 'delivered':
        trackEmailEvent('delivered', event.email)
        break
      case 'bounce':
        handleBounce(event.email, event.reason)
        break
      case 'spam_report':
        handleSpamReport(event.email)
        break
    }
  })
  
  res.status(200).send('OK')
})
```

### 2. Critical Alerts
- Bounce rate > 5%
- Spam complaints > 1%
- Delivery rate < 95%
- API quota próximo do limite

## 🔒 Security Best Practices

### 1. API Key Protection
```bash
# Nunca committar API keys
# Usar environment variables
# Rotacionar keys regularmente
# Monitorar uso da API
```

### 2. DKIM/SPF Configuration
```txt
# Adicionar ao DNS:
v=spf1 include:sendgrid.net ~all

# DKIM será configurado automaticamente pelo SendGrid
```

## 🧪 Testing Strategy

### 1. Email Testing Tools
- [Mailtrap](https://mailtrap.io/) - Development
- [SendGrid Email Testing](https://sendgrid.com/docs/ui/sending-email/email-testing/) - Production

### 2. Test Script
```javascript
// test-email.js
const sendTestEmail = async () => {
  const response = await fetch('/api/send-test-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'test@yourdomain.com',
      template: 'welcome',
      data: { name: 'Test User' }
    })
  })
  
  console.log('Email sent:', response.status)
}
```

## 📈 Performance Optimization

### 1. Email Queue
```javascript
// Usar Redis para queue
const emailQueue = new Queue('email sending', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3
  }
})
```

### 2. Batch Sending
```javascript
// Para newsletters/broadcasts
const sendBatch = async (emails, template) => {
  const batches = chunk(emails, 1000) // SendGrid limit
  
  for (const batch of batches) {
    await sendgrid.send({
      personalizations: batch.map(email => ({ to: [{ email }] })),
      from: { email: 'noreply@yourdomain.com' },
      template_id: template
    })
    
    await sleep(1000) // Rate limiting
  }
}
```

---

## ✅ Production Checklist

- [ ] SendGrid account criada e verificada
- [ ] Domain authentication configurada
- [ ] DNS records adicionados
- [ ] Templates HTML criados
- [ ] NextAuth configurado
- [ ] Webhooks de tracking implementados
- [ ] Email analytics configurado
- [ ] Unsubscribe handling implementado
- [ ] Rate limiting configurado
- [ ] Error monitoring ativo
- [ ] Backup de templates criado
- [ ] Testes end-to-end executados

**🎯 Meta**: Delivery rate > 98%, Bounce rate < 2%