import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../../server/prisma";

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
      sendVerificationRequest({
        identifier: email,
        url,
        provider: { server, from }
      }) {
        console.log('📧 [NextAuth] sendVerificationRequest chamado para:', email);
        console.log('🔗 [NextAuth] Magic link URL:', url);
        console.log('⚙️ [NextAuth] Server config:', { 
          host: server.host, 
          port: server.port, 
          user: server.auth?.user 
        });
        
        return new Promise((resolve, reject) => {
          const { createTransport } = require('nodemailer');
          
          console.log('🚀 [NextAuth] Criando transport do nodemailer...');
          const transport = createTransport(server);
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">🎉 Bem-vindo ao Chatterfy!</h1>
                  <p style="color: #666; font-size: 16px; margin: 0;">Complete seu cadastro para começar a usar conversas ilimitadas</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
                    Olá! 👋<br><br>
                    Você solicitou acesso ao nosso Chatterfy. Clique no botão abaixo para <strong>completar seu cadastro</strong> e começar a usar:
                  </p>
                  
                  <ul style="color: #666; margin: 20px 0; padding-left: 20px;">
                    <li>💬 <strong>Conversas ilimitadas</strong> com IA</li>
                    <li>📚 <strong>Histórico salvo</strong> permanentemente</li>
                    <li>⚙️ <strong>Configurações personalizadas</strong></li>
                    <li>🎨 <strong>Temas e preferências</strong></li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${url}" style="display: inline-block; background-color: #10a37f; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(16,163,127,0.3);">
                    ✨ Completar Cadastro e Entrar
                  </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
                    Este link é válido por 24 horas e só pode ser usado uma vez.<br>
                    Se você não solicitou este cadastro, pode ignorar este email com segurança.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                  <p style="color: #666; font-size: 12px; margin: 0;">
                    Chatterfy - Sua IA pessoal para conversas inteligentes
                  </p>
                </div>
              </div>
            </div>
          `;

          const emailText = `
Bem-vindo ao Chatterfy! 🎉

Complete seu cadastro para começar a usar conversas ilimitadas.

Clique no link abaixo para completar seu cadastro:
${url}

Com sua conta você terá:
• Conversas ilimitadas com IA
• Histórico salvo permanentemente  
• Configurações personalizadas
• Temas e preferências

Este link é válido por 24 horas.
Se você não solicitou este cadastro, pode ignorar este email.

Chatterfy - Sua IA pessoal para conversas inteligentes
          `;

          console.log('📮 [NextAuth] Enviando email para:', email);
          
          transport.sendMail({
            from,
            to: email,
            subject: "🚀 Complete seu cadastro no Chatterfy",
            text: emailText,
            html: emailHtml,
          }).then((result) => {
            console.log('✅ [NextAuth] Email enviado com sucesso!');
            console.log('📊 [NextAuth] Resultado do envio:', {
              messageId: result.messageId,
              response: result.response
            });
            resolve();
          }).catch((error) => {
            console.error('❌ [NextAuth] ERRO ao enviar email:', error);
            console.error('🔍 [NextAuth] Detalhes do erro:', {
              message: error.message,
              code: error.code,
              command: error.command
            });
            reject(error);
          });
        });
      },
    })
  ],
  session: { strategy: "database" },
  pages: {
    signIn: '/auth',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async signIn({ user }: any) {
      console.log('🔐 [NextAuth] signIn callback chamado para:', user.email);
      
      try {
        // Onboarding automático: criar org para novos usuários
        if (user.email) {
          console.log('🔍 [NextAuth] Verificando usuário existente...');
          
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { org: true }
          });

          console.log('👤 [NextAuth] Usuário existente:', !!existingUser);

          if (!existingUser) {
            console.log('🆕 [NextAuth] Criando novo usuário e organização...');
            
            // Novo usuário - criar org pessoal
            const orgName = user.name || user.email.split('@')[0];
            
            // Buscar plano padrão
            console.log('💰 [NextAuth] Buscando plano FREE...');
            let freePlan = await prisma.plan.findUnique({
              where: { code: "FREE" }
            });
            
            if (!freePlan) {
              console.log('📝 [NextAuth] Criando plano FREE...');
              // Se não existir, criar plano FREE básico
              freePlan = await prisma.plan.create({
                data: {
                  code: "FREE",
                  name: "Free Plan",
                  monthlyCreditsTokens: 10000,
                  dailyTokenLimit: 10000,
                  storageLimitMB: 10,
                  maxFileSizeMB: 5,
                  features: JSON.stringify({})
                }
              });
              console.log('✅ [NextAuth] Plano FREE criado:', freePlan.id);
            } else {
              console.log('✅ [NextAuth] Plano FREE encontrado:', freePlan.id);
            }

            console.log('🏢 [NextAuth] Criando organização...');
            const newOrg = await prisma.organization.create({
              data: {
                name: `${orgName}'s Organization`,
                users: {
                  create: {
                    email: user.email,
                    name: user.name || orgName
                  }
                },
                subscriptions: {
                  create: {
                    planId: freePlan.id,
                    active: true,
                    periodStart: new Date(),
                    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
                  }
                }
              }
            });
            console.log('✅ [NextAuth] Organização criada:', newOrg.id);
          }
        }
        
        console.log('✅ [NextAuth] signIn callback concluído com sucesso');
        return true;
        
      } catch (error) {
        console.error('❌ [NextAuth] ERRO no signIn callback:', error);
        console.error('🔍 [NextAuth] Stack trace:', error.stack);
        console.error('🔍 [NextAuth] Erro detalhado:', {
          message: error.message,
          code: error.code,
          meta: error.meta
        });
        
        // Retorna true mesmo com erro para não bloquear o login
        // O usuário pode continuar mas sem org criada
        return true;
      }
    },
    async session({ session, user }: any) {
      // Adicionar informações da org na sessão
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { org: true }
        });
        
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.orgId = dbUser.orgId;
          session.user.orgName = dbUser.org.name;
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
