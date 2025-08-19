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

    // Fazer requisição para a API backend para criar portal de cobrança
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';
    const response = await fetch(`${backendUrl}/v1/user/billing-portal`, {
      method: 'POST',
      headers: {
        'X-Org-Id': user.orgId,
        'X-User-Id': user.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        returnUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard`
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 400) {
        return NextResponse.json({
          success: false,
          error: errorData.details || 'Para acessar o portal de cobrança, você precisa ter uma assinatura ativa. Faça upgrade para PRO primeiro.',
          action: errorData.action || 'upgrade_required',
          currentPlan: errorData.currentPlan || 'FREE',
          availablePlans: errorData.availablePlans || ['PRO']
        });
      }
      
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Portal de cobrança não está disponível no momento. Entre em contato com o suporte.'
        });
      }
      
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error accessing billing portal:', error);
    return NextResponse.json(
      { error: 'Failed to access billing portal' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}