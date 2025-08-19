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

export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      success: true,
      hasApiKey: !!user.org?.apiKey,
      keyPreview: user.org?.apiKey ? `${user.org.apiKey.substring(0, 12)}...` : null,
      createdAt: user.org?.apiKeyCreatedAt,
      orgId: user.orgId,
      userEmail: session.user.email
    });

  } catch (error) {
    console.error('Error checking API key status:', error);
    return NextResponse.json(
      { error: 'Failed to check API key status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}