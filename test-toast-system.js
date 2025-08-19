const { chromium } = require('playwright');

async function testToastSystem() {
  console.log('🧪 Iniciando teste do sistema de toasts...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  
  const page = await browser.newPage();
  
  // Monitor console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  try {
    // Navegar para a aplicação
    console.log('📱 Navegando para http://localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    // Aguardar carregar
    await page.waitForTimeout(2000);
    
    // Abrir modal de configurações
    console.log('⚙️ Procurando botão de configurações...');
    
    // Aguardar pelo botão de configurações aparecer
    await page.waitForSelector('[data-testid="settings-button"], button:has-text("Configurações"), button:has-text("Settings")', { timeout: 10000 });
    
    const settingsButton = await page.locator('[data-testid="settings-button"], button:has-text("Configurações"), button:has-text("Settings")').first();
    
    if (await settingsButton.count() > 0) {
      console.log('✅ Botão de configurações encontrado');
      await settingsButton.click();
      await page.waitForTimeout(1000);
      
      // Procurar por seção de API Keys
      console.log('🔑 Procurando seção de chaves API...');
      
      // Aguardar modal aparecer
      await page.waitForSelector('[class*="modal"], [role="dialog"]', { timeout: 5000 });
      
      // Procurar pela seção de API Keys ou botão copiar
      const copyButton = await page.locator('button:has-text("Copiar"), button:has-text("Copy")').first();
      
      if (await copyButton.count() > 0) {
        console.log('📋 Botão copiar encontrado, testando toast...');
        
        // Clicar no botão copiar para trigger o toast
        await copyButton.click();
        
        // Aguardar toast aparecer
        await page.waitForTimeout(1000);
        
        // Verificar se toast apareceu
        const toastContainer = await page.locator('[class*="container"], .toast, [class*="toast"]');
        const toastVisible = await toastContainer.count() > 0;
        
        if (toastVisible) {
          console.log('🎉 Toast detectado! Sistema funcionando');
          
          // Verificar texto do toast
          const toastText = await page.textContent('[class*="toast"] [class*="message"], .toast .message, [class*="message"]');
          console.log('📝 Texto do toast:', toastText);
          
          // Aguardar toast desaparecer
          await page.waitForTimeout(4000);
          
          console.log('✅ Teste de toast concluído com sucesso!');
        } else {
          console.log('⚠️ Toast não foi detectado visualmente');
          
          // Verificar se há logs de erro
          const pageContent = await page.content();
          console.log('📄 Verificando conteúdo da página...');
        }
      } else {
        console.log('⚠️ Botão copiar não encontrado - verificando estrutura do modal...');
        
        // Debug: mostrar estrutura do modal
        const modalContent = await page.textContent('[class*="modal"], [role="dialog"]');
        console.log('🔍 Conteúdo do modal:', modalContent.substring(0, 500));
      }
      
    } else {
      console.log('❌ Botão de configurações não encontrado');
      
      // Debug: listar todos os botões
      const buttons = await page.locator('button').all();
      console.log(`🔍 Encontrados ${buttons.length} botões na página`);
      
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const text = await buttons[i].textContent();
        console.log(`   ${i + 1}. "${text?.trim() || 'sem texto'}"`);
      }
    }
    
    // Screenshot final
    await page.screenshot({ 
      path: 'test-toast-system-final.png', 
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    
    // Screenshot de erro
    await page.screenshot({ 
      path: 'test-toast-system-error.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testToastSystem().catch(console.error);