const { chromium } = require('playwright');

(async () => {
  console.log('🔐 Teste de comportamento com login...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    console.log('1️⃣ FASE 1: Testando como usuário anônimo');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Enviar mensagem como anônimo
    console.log('📤 Enviando mensagem como anônimo...');
    await page.fill('textarea', 'Teste como usuário anônimo');
    await page.click('button[type="submit"]');
    
    // Aguardar resposta
    await page.waitForTimeout(20000);
    
    // Verificar threads anônimas
    const anonData = await page.evaluate(() => {
      const sessionId = localStorage.getItem('anonymous_session_id');
      const threads = localStorage.getItem('chat_threads_' + sessionId);
      return {
        sessionId,
        threadCount: threads ? JSON.parse(threads).length : 0,
        conversationCount: localStorage.getItem('anonymous_conversation_count')
      };
    });
    
    console.log(`📊 Dados anônimos: ${anonData.threadCount} threads, ${anonData.conversationCount} conversas`);
    
    console.log('\n2️⃣ FASE 2: Tentando fazer login');
    
    // Procurar botão de login/cadastro
    const loginSelectors = [
      'text="Login"',
      'text="Entrar"', 
      'text="Sign in"',
      'text="Cadastro"',
      'text="Sign up"',
      '[href*="/auth"]',
      'button:has-text("Login")',
      'a:has-text("Entrar")'
    ];
    
    let loginButton = null;
    for (const selector of loginSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.count() > 0) {
          loginButton = element;
          console.log(`✅ Encontrou botão de login: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue procurando
      }
    }
    
    if (loginButton) {
      console.log('🔑 Clicando no botão de login...');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verificar se chegou na página de auth
      const currentUrl = page.url();
      console.log(`📍 URL atual: ${currentUrl}`);
      
      if (currentUrl.includes('/auth')) {
        console.log('✅ Chegou na página de autenticação');
        
        // Tentar inserir email de teste
        const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.count() > 0) {
          console.log('📧 Inserindo email de teste...');
          await emailInput.fill('teste@exemplo.com');
          
          // Procurar botão de enviar
          const submitButton = await page.locator('button[type="submit"], button:has-text("Enviar"), button:has-text("Send")').first();
          if (await submitButton.count() > 0) {
            console.log('📤 Enviando formulário de login...');
            await submitButton.click();
            await page.waitForTimeout(3000);
            
            console.log('✉️ Deve ter enviado email de magic link');
            console.log('⚠️ Como é magic link, não podemos completar o login no teste automatizado');
          }
        }
      }
    } else {
      console.log('❌ Não encontrou botão de login na interface');
      console.log('🔍 Tentando navegar diretamente para /auth...');
      
      await page.goto('http://localhost:3001/auth');
      await page.waitForLoadState('networkidle');
      
      const authPageExists = !page.url().includes('404');
      console.log(`📍 Página /auth existe: ${authPageExists}`);
      
      if (authPageExists) {
        console.log('✅ Página de auth carregada');
        
        // Verificar elementos da página de auth
        const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
        const hasSubmitButton = await page.locator('button[type="submit"]').count() > 0;
        
        console.log(`📧 Tem campo de email: ${hasEmailInput}`);
        console.log(`🔘 Tem botão submit: ${hasSubmitButton}`);
      }
    }
    
    console.log('\n3️⃣ FASE 3: Simulando estado logado (modificando localStorage)');
    
    // Simular estado de usuário logado no localStorage
    await page.evaluate(() => {
      // Simular session token
      localStorage.setItem('nextauth.session-token', 'fake-session-token');
      
      // Simular user data
      const userData = {
        user: {
          id: 'user123',
          email: 'teste@exemplo.com',
          name: 'Usuário Teste',
          orgId: 'org123',
          orgName: 'Organização Teste'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      localStorage.setItem('chat_threads_teste@exemplo.com', JSON.stringify([]));
    });
    
    console.log('🔄 Recarregando página para simular login...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar se o comportamento mudou
    await page.waitForTimeout(3000);
    
    console.log('📤 Testando mensagem como usuário "logado"...');
    await page.fill('textarea', 'Teste como usuário logado simulado');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(15000);
    
    // Verificar dados finais
    const finalData = await page.evaluate(() => {
      const anonSessionId = localStorage.getItem('anonymous_session_id');
      const anonThreads = localStorage.getItem('chat_threads_' + anonSessionId);
      const userThreads = localStorage.getItem('chat_threads_teste@exemplo.com');
      
      return {
        anonThreadCount: anonThreads ? JSON.parse(anonThreads).length : 0,
        userThreadCount: userThreads ? JSON.parse(userThreads).length : 0,
        localStorage: Object.keys(localStorage).filter(k => k.includes('chat_threads'))
      };
    });
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`👻 Threads anônimas: ${finalData.anonThreadCount}`);
    console.log(`👤 Threads do usuário: ${finalData.userThreadCount}`);
    console.log(`💾 Chaves localStorage: ${finalData.localStorage.join(', ')}`);
    
    await page.screenshot({ path: 'login-test-final.png', fullPage: true });
    
  } catch (error) {
    console.log('💥 ERRO:', error.message);
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();