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

    const body = await request.json();

    // Fazer requisição para a API backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';
    const response = await fetch(`${backendUrl}/v1/user/upgrade`, {
      method: 'POST',
      headers: {
        'X-Org-Id': user.orgId,
        'X-User-Id': user.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error upgrading plan:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade plan' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}