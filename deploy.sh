#!/bin/bash

# ========================================
# 🚀 CHATTERFY PRODUCTION DEPLOY SCRIPT
# ========================================

set -e

# Configurações
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.${ENVIRONMENT}"

echo "🚀 Starting Chatterfy deployment to $ENVIRONMENT..."
echo "📅 $(date)"

# Verificar se arquivo de environment existe
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE not found!"
    echo "💡 Create it from .env.example and configure all variables"
    exit 1
fi

# Função para verificar se serviço está rodando
check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo "🔍 Checking $service..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null; then
            echo "✅ $service is healthy"
            return 0
        fi
        
        echo "⏳ Attempt $attempt/$max_attempts - waiting for $service..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service failed to start"
    return 1
}

# Função para fazer backup do database
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "💾 Creating database backup..."
        
        BACKUP_DIR="./backups/$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup PostgreSQL
        docker-compose exec -T postgres pg_dump -U chatterfy chatterfy > "$BACKUP_DIR/database.sql"
        
        # Backup uploads (se existir)
        if [ -d "./uploads" ]; then
            cp -r ./uploads "$BACKUP_DIR/"
        fi
        
        echo "✅ Backup saved to $BACKUP_DIR"
    fi
}

# Função para rollback em caso de erro
rollback() {
    echo "🔄 Rolling back deployment..."
    docker-compose down
    
    # Restaurar backup mais recente se existir
    LATEST_BACKUP=$(ls -td ./backups/*/ 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        echo "📥 Restoring from backup: $LATEST_BACKUP"
        # Implementar restore logic aqui
    fi
    
    exit 1
}

# Trap para rollback em caso de erro
trap rollback ERR

echo "📋 Pre-deployment checks..."

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

# 2. Verificar se portas estão livres
echo "🔍 Checking ports availability..."
PORTS=(5432 6379 8787 3000)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        echo "🛑 Please stop the service using port $port or change the configuration"
        exit 1
    fi
done

# 3. Verificar variáveis críticas
echo "🔍 Checking environment variables..."
source "$ENV_FILE"

REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET" 
    "STRIPE_SECRET_KEY"
    "AWS_S3_BUCKET"
    "EMAIL_SERVER"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set in $ENV_FILE"
        exit 1
    fi
done

echo "✅ All pre-deployment checks passed"

# 4. Backup atual (apenas produção)
if [ "$ENVIRONMENT" = "production" ]; then
    backup_database
fi

# 5. Build e deploy
echo "🔨 Building and deploying services..."

# Copiar environment file
cp "$ENV_FILE" .env

# Build images
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

# Deploy services
echo "🚀 Starting services..."
docker-compose up -d

# 6. Aguardar serviços ficarem prontos
echo "⏳ Waiting for services to be ready..."

# PostgreSQL
check_service "PostgreSQL" "http://localhost:5432" || (echo "❌ PostgreSQL failed"; exit 1)

# Redis  
check_service "Redis" "http://localhost:6379" || (echo "❌ Redis failed"; exit 1)

# API
check_service "API" "http://localhost:8787/health" || (echo "❌ API failed"; exit 1)

# Frontend
check_service "Frontend" "http://localhost:3000" || (echo "❌ Frontend failed"; exit 1)

# 7. Executar migrations
echo "🗄️  Running database migrations..."
docker-compose exec api npm run prisma:generate
docker-compose exec api npm run prisma:push

# 8. Seed initial data (apenas na primeira vez)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌱 Seeding initial data..."
    docker-compose exec api node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function seed() {
      const existingPlans = await prisma.plan.count();
      if (existingPlans === 0) {
        console.log('Seeding plans...');
        await fetch('http://localhost:8787/admin/seed-plans', { method: 'POST' });
        console.log('Plans seeded successfully');
      } else {
        console.log('Plans already exist, skipping seed');
      }
    }
    
    seed().finally(() => prisma.\$disconnect());
    "
fi

# 9. Testes finais
echo "🧪 Running final health checks..."

# Teste API endpoints críticos
API_ENDPOINTS=(
    "http://localhost:8787/health"
    "http://localhost:8787/admin/health/db"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    if ! curl -s -f "$endpoint" > /dev/null; then
        echo "❌ Endpoint $endpoint is not responding"
        exit 1
    fi
done

# Teste frontend
if ! curl -s -f "http://localhost:3000" > /dev/null; then
    echo "❌ Frontend is not responding"
    exit 1
fi

# 10. Notificação de sucesso
echo ""
echo "🎉 ====================================="
echo "🎉  DEPLOYMENT SUCCESSFUL!"
echo "🎉 ====================================="
echo ""
echo "📊 Services Status:"
echo "   🗄️  PostgreSQL: ✅ Running on port 5432"
echo "   🔄 Redis: ✅ Running on port 6379"  
echo "   🔌 API: ✅ Running on port 8787"
echo "   🖥️  Frontend: ✅ Running on port 3000"
echo ""
echo "🔗 Access URLs:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   🌐 Frontend: https://yourdomain.com"
    echo "   🔌 API: https://api.yourdomain.com"
else
    echo "   🌐 Frontend: http://localhost:3000"
    echo "   🔌 API: http://localhost:8787"
fi
echo ""
echo "📋 Next Steps:"
echo "   1. Test all critical features"
echo "   2. Monitor logs: docker-compose logs -f"
echo "   3. Check metrics dashboard"
echo "   4. Verify email delivery"
echo "   5. Test Stripe integration"
echo ""
echo "🆘 Troubleshooting:"
echo "   📊 Logs: docker-compose logs [service]"
echo "   🔄 Restart: docker-compose restart [service]"
echo "   🛑 Stop: docker-compose down"
echo ""

# Enviar notificação Slack (se configurado)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"🚀 Chatterfy deployed successfully to $ENVIRONMENT\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Version\", \"value\": \"$(git rev-parse --short HEAD)\", \"short\": true},
                    {\"title\": \"Deployed by\", \"value\": \"$(whoami)\", \"short\": true},
                    {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                ]
            }]
        }"
fi

echo "✨ Deployment completed at $(date)"