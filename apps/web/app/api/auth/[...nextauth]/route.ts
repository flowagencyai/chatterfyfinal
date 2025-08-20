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
            subject: "🚀 Complete seu cadastro no Chatterfy",
            text: `Complete seu cadastro no Chatterfy: ${url}`,
            html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Chatterfy</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    
    /* Main styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f8fafc;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #334155;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 10px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .header p {
      color: #e2e8f0;
      font-size: 16px;
      margin: 0;
      font-weight: 300;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .welcome-text {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 25px;
      font-weight: 500;
    }
    
    .description {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    
    .benefits-section {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      border-left: 4px solid #667eea;
    }
    
    .benefits-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 15px;
    }
    
    .benefits-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .benefits-list li {
      padding: 8px 0;
      font-size: 15px;
      color: #475569;
      position: relative;
      padding-left: 30px;
    }
    
    .benefits-list li:before {
      content: "✨";
      position: absolute;
      left: 0;
      top: 8px;
      font-size: 16px;
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
      text-transform: none;
    }
    
    .cta-button:hover {
      box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }
    
    .security-note {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 25px 0;
      font-size: 14px;
      color: #92400e;
    }
    
    .footer {
      background-color: #f1f5f9;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      font-size: 14px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      
      .header, .content, .footer {
        padding: 25px 20px !important;
      }
      
      .header h1 {
        font-size: 24px !important;
      }
      
      .cta-button {
        padding: 14px 30px !important;
        font-size: 15px !important;
      }
      
      .benefits-section {
        margin: 20px 0 !important;
        padding: 20px !important;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 20px 0;">
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <h1>🎉 Bem-vindo ao Chatterfy!</h1>
        <p>Sua plataforma inteligente de conversas com IA está quase pronta</p>
      </div>
      
      <!-- Content -->
      <div class="content">
        <p class="welcome-text">Olá! 👋</p>
        
        <p class="description">
          Você está a apenas um clique de acessar o <strong>Chatterfy</strong>, a plataforma mais avançada para conversas inteligentes com IA. Complete seu cadastro agora e descubra um novo mundo de possibilidades!
        </p>
        
        <!-- Benefits Section -->
        <div class="benefits-section">
          <h3 class="benefits-title">🚀 O que você terá acesso:</h3>
          <ul class="benefits-list">
            <li><strong>Conversas ilimitadas</strong> com os melhores modelos de IA</li>
            <li><strong>Histórico permanente</strong> de todas as suas conversas</li>
            <li><strong>Upload de arquivos</strong> e análise de documentos</li>
            <li><strong>Interface moderna</strong> e totalmente responsiva</li>
            <li><strong>Configurações personalizadas</strong> para sua experiência</li>
            <li><strong>Suporte premium</strong> sempre que precisar</li>
          </ul>
        </div>
        
        <!-- CTA Section -->
        <div class="cta-section">
          <a href="${url}" class="cta-button">✨ Completar Cadastro e Entrar</a>
        </div>
        
        <!-- Security Note -->
        <div class="security-note">
          🔒 <strong>Link seguro:</strong> Este link é único e expira em 24 horas. Use-o apenas uma vez para acessar sua conta com segurança.
        </div>
        
        <p style="color: #64748b; font-size: 15px; margin-top: 30px;">
          Não consegue clicar no botão? Copie e cole este link em seu navegador:<br>
          <a href="${url}" style="color: #667eea; word-break: break-all; font-size: 14px;">${url}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>
          <strong>Chatterfy</strong> - Sua IA, suas regras<br>
          <a href="#">Central de Ajuda</a> | <a href="#">Política de Privacidade</a> | <a href="#">Termos de Uso</a>
        </p>
        <p style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
          Se você não solicitou este cadastro, pode ignorar este email com segurança.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
            `,
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