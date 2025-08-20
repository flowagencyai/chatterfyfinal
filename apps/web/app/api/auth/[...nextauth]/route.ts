import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../../server/prisma";

console.log('🔧 [NextAuth] Inicializando configuração SIMPLIFICADA com PrismaAdapter...');

const handler = NextAuth({
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
      sendVerificationRequest: async ({ identifier: email, url }) => {
        console.log('📧 [NextAuth] SIMPLIFICADO - Enviando email para:', email);
        console.log('🔗 [NextAuth] SIMPLIFICADO - URL:', url);
        
        const { createTransport } = require('nodemailer');
        const transport = createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        });

        try {
          const result = await transport.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "🚀 Link de acesso ao Chatterfy",
            text: `Clique no link para acessar: ${url}`,
            html: `<p>Clique no link para acessar: <a href="${url}">Entrar no Chatterfy</a></p>`,
          });
          
          console.log('✅ [NextAuth] SIMPLIFICADO - Email enviado com sucesso!', result.messageId);
        } catch (error) {
          console.error('❌ [NextAuth] SIMPLIFICADO - Erro ao enviar email:', error.message);
          throw error;
        }
      }
    })
  ],
  session: { strategy: "database" },
  pages: {
    signIn: '/auth',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async signIn({ user }: any) {
      console.log('🔐 [NextAuth] signIn callback para:', user.email);
      
      try {
        // Verificar se usuário já existe
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          console.log('🆕 [NextAuth] Novo usuário - criação será feita pelo PrismaAdapter');
          // PrismaAdapter criará o usuário automaticamente
          // Não criamos organização aqui para evitar conflitos
        } else {
          console.log('👤 [NextAuth] Usuário existente encontrado');
        }
        
        return true;
        
      } catch (error) {
        console.error('❌ [NextAuth] Erro no signIn callback:', error.message);
        // Autorizar mesmo com erro para não bloquear login
        return true;
      }
    },
    async session({ session, user }: any) {
      console.log('👤 [NextAuth] SIMPLIFICADO - session callback');
      // Adicionar user ID básico
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

console.log('✅ [NextAuth] Configuração SIMPLIFICADA criada');

export { handler as GET, handler as POST };