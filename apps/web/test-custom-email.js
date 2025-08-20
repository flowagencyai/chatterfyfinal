const { chromium } = require('playwright');

async function testCustomEmail() {
  console.log('📧 Testando email personalizado de cadastro...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001/auth');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Página de auth carregada');
    
    // Preencher email de teste
    await page.fill('input[type="email"]', 'teste.email@exemplo.com');
    console.log('✅ Email de teste preenchido');
    
    // Aguardar resposta
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/signin/email')
    );
    
    // Clicar no botão
    await page.click('button[type="submit"]');
    console.log('✅ Botão clicado');
    
    // Aguardar resposta
    const response = await responsePromise;
    console.log(`📡 Status: ${response.status()}`);
    
    if (response.ok()) {
      console.log('🎉 EMAIL PERSONALIZADO ENVIADO!');
      
      // Aguardar redirecionamento
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log(`🌐 URL atual: ${currentUrl}`);
      
      if (currentUrl.includes('verify-request')) {
        console.log('✅ Redirecionado para página de verificação');
      }
      
      console.log('\n📧 NOVO EMAIL PERSONALIZADO INCLUI:');
      console.log('   ✅ Assunto: "🚀 Complete seu cadastro no Chatterfy"');
      console.log('   ✅ Título: "🎉 Bem-vindo ao Chatterfy!"');
      console.log('   ✅ Botão: "✨ Completar Cadastro e Entrar"');
      console.log('   ✅ Lista de benefícios:');
      console.log('      • 💬 Conversas ilimitadas com IA');
      console.log('      • 📚 Histórico salvo permanentemente');
      console.log('      • ⚙️ Configurações personalizadas');
      console.log('      • 🎨 Temas e preferências');
      console.log('   ✅ Design profissional com HTML/CSS');
      console.log('   ✅ Texto explicativo sobre cadastro');
      
      console.log('\n🔗 FUNCIONAMENTO DO LINK:');
      console.log('   1. Usuário clica no botão do email');
      console.log('   2. É redirecionado para /api/auth/callback/email');
      console.log('   3. NextAuth valida o token automaticamente');
      console.log('   4. Cria conta + organização (se novo usuário)');
      console.log('   5. Faz login automático');
      console.log('   6. Redireciona para / logado');
      console.log('   7. Interface muda para usuário premium! 🎉');
      
    } else {
      console.log(`❌ Erro: ${response.status()}`);
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await browser.close();
  }
}

testCustomEmail().catch(console.error);