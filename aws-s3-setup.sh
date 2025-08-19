#!/bin/bash

# ============================================
# 🚀 AWS S3 Setup Script para Chatterfy
# ============================================

set -e

echo "🚀 Configurando AWS S3 para Chatterfy..."

# Variáveis (substitua pelos seus valores)
BUCKET_NAME="${AWS_S3_BUCKET:-chatterfy-production-files}"
BACKUP_BUCKET="${BACKUP_S3_BUCKET:-chatterfy-backups}"
REGION="${AWS_S3_REGION:-us-east-1}"

echo "📦 Bucket principal: $BUCKET_NAME"
echo "💾 Bucket backup: $BACKUP_BUCKET"
echo "🌍 Região: $REGION"

# 1. Criar bucket principal
echo "1️⃣ Criando bucket principal..."
aws s3 mb s3://$BUCKET_NAME --region $REGION

# 2. Criar bucket de backup
echo "2️⃣ Criando bucket de backup..."
aws s3 mb s3://$BACKUP_BUCKET --region $REGION

# 3. Configurar CORS para o bucket principal
echo "3️⃣ Configurando CORS..."
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://yourdomain.com", "https://www.yourdomain.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors.json

# 4. Configurar política de bucket (público para leitura apenas)
echo "4️⃣ Configurando política de bucket..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/public/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

# 5. Configurar lifecycle policy para limpeza automática
echo "5️⃣ Configurando lifecycle policy..."
cat > lifecycle.json << EOF
{
  "Rules": [
    {
      "ID": "DeleteIncompleteMultipartUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    },
    {
      "ID": "DeleteOldTempFiles",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration --bucket $BUCKET_NAME --lifecycle-configuration file://lifecycle.json

# 6. Habilitar versionamento no bucket de backup
echo "6️⃣ Habilitando versionamento no bucket de backup..."
aws s3api put-bucket-versioning --bucket $BACKUP_BUCKET --versioning-configuration Status=Enabled

# 7. Configurar encryption
echo "7️⃣ Configurando encryption..."
aws s3api put-bucket-encryption --bucket $BUCKET_NAME --server-side-encryption-configuration '{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }
  ]
}'

aws s3api put-bucket-encryption --bucket $BACKUP_BUCKET --server-side-encryption-configuration '{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }
  ]
}'

# 8. Criar estrutura de pastas
echo "8️⃣ Criando estrutura de pastas..."
aws s3api put-object --bucket $BUCKET_NAME --key uploads/
aws s3api put-object --bucket $BUCKET_NAME --key public/
aws s3api put-object --bucket $BUCKET_NAME --key private/
aws s3api put-object --bucket $BUCKET_NAME --key temp/

# 9. Configurar notificações (opcional)
echo "9️⃣ Configurando notificações..."
cat > notification.json << EOF
{
  "CloudWatchConfiguration": {
    "CloudWatchRoles": []
  }
}
EOF

# 10. Configurar monitoring básico
echo "🔟 Configurando monitoring..."
aws s3api put-bucket-metrics-configuration \
  --bucket $BUCKET_NAME \
  --id EntireBucket \
  --metrics-configuration Id=EntireBucket,Status=Enabled

# Limpeza
rm -f cors.json bucket-policy.json lifecycle.json notification.json

echo "✅ Configuração AWS S3 concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis no .env.production:"
echo "   AWS_S3_BUCKET=$BUCKET_NAME"
echo "   AWS_S3_REGION=$REGION"
echo "   BACKUP_S3_BUCKET=$BACKUP_BUCKET"
echo ""
echo "2. Teste a conectividade:"
echo "   aws s3 ls s3://$BUCKET_NAME"
echo ""
echo "3. URLs dos buckets:"
echo "   Principal: https://s3.$REGION.amazonaws.com/$BUCKET_NAME"
echo "   Backup: https://s3.$REGION.amazonaws.com/$BACKUP_BUCKET"
echo ""
echo "🔐 Não esqueça de configurar IAM policies apropriadas!"