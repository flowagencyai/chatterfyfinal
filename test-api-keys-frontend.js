const { chromium } = require('playwright');

async function testApiKeysFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Iniciando teste de API Keys...\n');
    
    // Ir para a página inicial
    console.log('📱 Navegando para http://localhost:3001...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Procurar pelo botão de settings (gear icon)
    console.log('⚙️ Procurando botão de configurações...');
    const settingsButton = page.locator('[data-testid="settings-button"], button[aria-label*="settings"], button[title*="settings"], .settings-button, button:has-text("⚙️"), button:has-text("Settings")').first();
    
    if (await settingsButton.isVisible()) {
      console.log('✅ Botão de configurações encontrado!');
      await settingsButton.click();
      await page.waitForTimeout(2000);
      
      // Procurar seção de API Keys
      console.log('🔍 Procurando seção de API Keys...');
      const apiKeySection = page.locator('text=API Keys').first();
      
      if (await apiKeySection.isVisible()) {
        console.log('✅ Seção API Keys encontrada!');
        
        // Procurar botões de gerenciar/criar API key
        const createButton = page.locator('button:has-text("Gerar"), button:has-text("Criar"), button:has-text("Generate"), button:has-text("Create")').first();
        const manageButton = page.locator('button:has-text("Gerenciar"), button:has-text("Manage")').first();
        
        if (await createButton.isVisible()) {
          console.log('🔑 Testando criação de API Key...');
          await createButton.click();
          await page.waitForTimeout(2000);
          
          // Verificar se modal abriu
          const modal = page.locator('[role="dialog"], .modal, .overlay').first();
          if (await modal.isVisible()) {
            console.log('✅ Modal de API Key aberto!');
            
            // Procurar botão de gerar na modal
            const generateModalButton = page.locator('button:has-text("Gerar"), button:has-text("Generate")').first();
            if (await generateModalButton.isVisible()) {
              console.log('🎯 Clicando em gerar API Key...');
              await generateModalButton.click();
              await page.waitForTimeout(3000);
              
              // Verificar se chave foi gerada
              const apiKeyDisplay = page.locator('input[value*="sk-"], code:has-text("sk-"), [class*="api-key"], [class*="generated-key"]').first();
              if (await apiKeyDisplay.isVisible()) {
                console.log('🎉 API Key gerada com sucesso!');
                const apiKeyValue = await apiKeyDisplay.inputValue() || await apiKeyDisplay.textContent();
                console.log(`🔑 Chave: ${apiKeyValue?.substring(0, 20)}...`);
              } else {
                console.log('❌ API Key não foi exibida');
              }
            }
          }
        } else if (await manageButton.isVisible()) {
          console.log('🔑 Testando gerenciamento de API Key...');
          await manageButton.click();
          await page.waitForTimeout(2000);
        } else {
          console.log('❌ Botões de API Key não encontrados');
          // Tirar screenshot para debug
          await page.screenshot({ path: 'debug-api-keys-not-found.png', fullPage: true });
        }
        
      } else {
        console.log('❌ Seção API Keys não encontrada no modal');
        // Tirar screenshot das configurações
        await page.screenshot({ path: 'debug-settings-modal.png', fullPage: true });
      }
      
    } else {
      console.log('❌ Botão de configurações não encontrado');
      // Verificar se precisa fazer login
      const signInButton = page.locator('button:has-text("Sign"), button:has-text("Login"), a[href*="auth"]').first();
      if (await signInButton.isVisible()) {
        console.log('🔐 Usuário não está logado. Precisa fazer login primeiro.');
      }
      
      // Tirar screenshot para debug
      await page.screenshot({ path: 'debug-main-page.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    console.log('\n📸 Screenshots salvos para debug se necessário');
    console.log('✋ Mantendo browser aberto para inspeção manual...');
    
    // Manter browser aberto por 30 segundos para inspeção manual
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

testApiKeysFlow().catch(console.error);