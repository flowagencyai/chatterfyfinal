import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

const prisma = new PrismaClient();

// Configuração NextAuth para usar com getServerSession
const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  ],
  session: { strategy: "database" as const },
  pages: {
    signIn: '/auth',
    verifyRequest: '/auth/verify-request',
  },
};

// Helper para gerar chave API segura
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { org: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar se não existe uma chave API
    if (!user.org?.apiKey) {
      return NextResponse.json({ 
        error: 'No API key exists. Use generate instead.' 
      }, { status: 400 });
    }

    // Gerar nova chave API
    const newApiKey = generateApiKey();

    // Atualizar organização com nova chave
    await prisma.organization.update({
      where: { id: user.orgId },
      data: { 
        apiKey: newApiKey,
        apiKeyCreatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'API key regenerated successfully',
      keyPreview: `cha_${newApiKey.substring(0, 8)}...${newApiKey.slice(-4)}`,
      fullKey: `cha_${newApiKey}`
    });

  } catch (error) {
    console.error('Error regenerating API key:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}