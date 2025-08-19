# 🤖 Chatterfy - Chat SaaS Platform

> Plataforma SaaS de chat inteligente com IA multi-provider, sistema de planos e monetização via Stripe.

## 🌟 Visão Geral

Chatterfy é uma plataforma completa de chat-as-a-service que oferece:

- 💬 **Chat Inteligente**: Integração com múltiplos provedores de IA (OpenAI, Anthropic, DeepSeek, Google, Ollama)
- 📊 **Sistema de Planos**: Controle de limites por tokens e storage
- 💳 **Monetização**: Integração completa com Stripe para pagamentos
- 👥 **Multi-tenant**: Suporte a organizações e usuários
- 📁 **Upload de Arquivos**: Sistema robusto com suporte S3
- 📈 **Analytics**: Tracking detalhado de uso e custos

## 🏗️ Arquitetura

### Stack Tecnológico

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Next.js 14 + App Router + React
- **Database**: Prisma ORM (SQLite dev / PostgreSQL prod)
- **Authentication**: NextAuth.js com magic link
- **Payments**: Stripe (subscriptions + webhooks)
- **Storage**: Local dev / AWS S3 prod

### Estrutura Monorepo

```
├── apps/
│   ├── api/                 # Backend API (Express)
│   │   ├── src/routes/      # Endpoints da API
│   │   ├── src/middleware/  # Rate limiting, auth, plans
│   │   ├── src/util/        # Helpers (Stripe, metering)
│   │   └── prisma/          # Schema do banco
│   └── web/                 # Frontend (Next.js)
│       ├── app/             # App Router structure
│       ├── app/components/  # React components
│       └── app/contexts/    # State management
├── packages/
│   ├── core/               # Provider adapters
│   └── shared/             # Types compartilhados
└── backups/                # Backups automáticos
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta Stripe (para pagamentos)
- Chaves de API dos provedores desejados

### Instalação

```bash
# Clone o repositório
git clone https://github.com/flowagencyai/chatterfy.git
cd chatterfy

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# Setup do banco de dados
cd apps/api
npm run prisma:generate
npm run prisma:push

# Seed dos planos padrão
curl -X POST http://localhost:8787/admin/seed-plans
```

### Executar em Development

```bash
# Terminal 1: API (porta 8787)
cd apps/api
npm run dev

# Terminal 2: Frontend (porta 3001)  
cd apps/web
PORT=3001 npm run dev
```

## 🔧 Configuração

### Variables de Ambiente

```env
# API Keys dos Provedores
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=file:./prisma/dev.db

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret
EMAIL_SERVER=smtp://...
```

### Endpoints Principais

#### Chat API
- `POST /v1/chat/completions` - Chat autenticado
- `POST /v1/anonymous/chat/completions` - Chat anônimo (limite 5 msgs)

#### Subscription API
- `GET /v1/plans` - Listar planos
- `POST /v1/user/upgrade` - Fazer upgrade
- `GET /v1/user/subscription-details` - Detalhes da subscription

#### Admin API
- `POST /admin/seed-plans` - Criar planos padrão
- `GET /admin/usage` - Relatórios de uso

## 📊 Sistema de Planos

### Tiers Disponíveis

| Plano | Preço | Tokens/Mês | Storage | Recursos |
|-------|-------|------------|---------|----------|
| **Free** | Grátis | 2M | 200MB | Básico |
| **Pro** | R$ 49,90 | 10M | 2GB | Completo + Suporte |

### Rate Limits

- **Global**: 120 req/min
- **Por Org**: 600 req/min  
- **Por User**: 240 req/min

## 🎯 Features

### ✅ Implementadas

- [x] Chat multi-provider com streaming
- [x] Sistema de autenticação (magic link)
- [x] Controle de planos e limites
- [x] Upload de arquivos
- [x] Integração Stripe completa
- [x] Webhooks para subscription lifecycle
- [x] Dashboard admin
- [x] Rate limiting inteligente
- [x] Tracking de uso e custos

### 🚧 Roadmap

- [ ] RAG (Retrieval Augmented Generation)
- [ ] API de embeddings
- [ ] Integração com mais providers
- [ ] Dashboard de analytics
- [ ] Notificações push
- [ ] Mobile app

## 🔒 Segurança

### Medidas Implementadas

- ✅ Rate limiting em múltiplas camadas
- ✅ Validação de input com Zod
- ✅ Isolamento por tenant
- ✅ Sanitização de uploads
- ✅ Webhook signature verification
- ✅ Secure session management

### Best Practices

- Tokens/keys nunca expostos no frontend
- CORS configurado adequadamente
- Headers de segurança implementados
- Prisma previne SQL injection
- File uploads com validação de tipo

## 📈 Analytics & Monitoring

### Métricas Trackadas

- **Usage**: Tokens por request, custos por provider
- **Performance**: Response times, error rates
- **Business**: MRR, churn rate, conversion
- **Technical**: Database queries, API health

### Logging

- Structured logging com timestamps
- Error tracking e alertas
- Request/response logging
- Stripe webhook events

## 🚀 Deploy em Produção

### Opções de Hosting

1. **Vercel + Railway**: Frontend na Vercel, API no Railway
2. **AWS**: ECS/Fargate + RDS + S3
3. **Docker**: Self-hosted com docker-compose

### Checklist de Deploy

- [ ] Environment variables configuradas
- [ ] Database migrado (PostgreSQL)
- [ ] Stripe webhooks configurados
- [ ] DNS e SSL configurados
- [ ] S3 bucket criado
- [ ] Monitoring ativo
- [ ] Backup strategy definida

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch: `git checkout -b feature/nova-feature`
3. Commit suas mudanças: `git commit -m 'Add nova feature'`
4. Push para a branch: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: Ver CLAUDE.md para detalhes técnicos
- **Issues**: [GitHub Issues](https://github.com/flowagencyai/chatterfy/issues)
- **Contato**: contato@flowagency.ai

---

**Desenvolvido com ❤️ por [Flow Agency](https://flowagency.ai)**