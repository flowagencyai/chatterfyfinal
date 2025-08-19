const { chromium } = require('playwright');

(async () => {
  console.log('🖥️  Teste final da UI - verificando se mensagens aparecem na tela...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📤 Enviando mensagem...');
    await page.fill('textarea', 'Teste UI final');
    await page.click('button[type="submit"]');
    
    console.log('⏳ Aguardando 25 segundos para resposta completa...');
    await page.waitForTimeout(25000);
    
    // Verificar se há mensagens visíveis na tela
    console.log('🔍 Verificando mensagens na UI...');
    
    // Procurar por diferentes seletores possíveis de mensagens
    const possibleSelectors = [
      '.message',
      '[role="message"]',
      '[data-role="user"]',
      '[data-role="assistant"]',
      '.user-message',
      '.assistant-message',
      '.message-user',
      '.message-assistant',
      '*[class*="message"]',
      '*[class*="Message"]'
    ];
    
    for (const selector of possibleSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Encontradas ${count} mensagens com seletor: ${selector}`);
        
        // Obter texto das mensagens
        const messages = await page.locator(selector).allTextContents();
        messages.forEach((msg, i) => {
          console.log(`  ${i + 1}. ${msg.substring(0, 100)}...`);
        });
      } else {
        console.log(`❌ Nenhuma mensagem encontrada com: ${selector}`);
      }
    }
    
    // Verificar se o MessageList component está renderizado
    const messageListExists = await page.locator('[data-testid="message-list"], .message-list, .messages').count();
    console.log(`📋 MessageList component existe: ${messageListExists > 0}`);
    
    // Verificar a estrutura da página
    const bodyHTML = await page.innerHTML('body');
    const hasChatArea = bodyHTML.includes('chatArea') || bodyHTML.includes('ChatArea');
    const hasMessageList = bodyHTML.includes('MessageList') || bodyHTML.includes('message-list');
    
    console.log(`🏗️  Estrutura da página:`);
    console.log(`  - ChatArea presente: ${hasChatArea}`);
    console.log(`  - MessageList presente: ${hasMessageList}`);
    
    // Screenshot para debug visual
    await page.screenshot({ path: 'ui-final-test.png', fullPage: true });
    console.log('📸 Screenshot salvo: ui-final-test.png');
    
  } catch (error) {
    console.log('💥 ERRO:', error.message);
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();