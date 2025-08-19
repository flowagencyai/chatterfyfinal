const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Teste detalhado do chat...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  // Capturar todos os logs do console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`🟡 [${type.toUpperCase()}] ${text}`);
  });
  
  // Capturar erros de rede
  page.on('requestfailed', request => {
    console.log(`❌ REDE FALHOU: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  // Capturar todas as requisições
  page.on('request', request => {
    if (request.url().includes('chat') || request.url().includes('session')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('chat') || response.url().includes('session')) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Verificar estado inicial
    console.log('🔍 Verificando estado inicial...');
    const initialHTML = await page.innerHTML('body');
    
    // Procurar área de mensagens
    const messageArea = await page.locator('[data-testid="message-list"], .message-list, .messages').first();
    const messageAreaExists = await messageArea.count() > 0;
    console.log(`📋 Área de mensagens existe: ${messageAreaExists}`);
    
    if (messageAreaExists) {
      const initialMessages = await messageArea.locator('.message, [role="message"], [data-role]').count();
      console.log(`📊 Mensagens iniciais: ${initialMessages}`);
    }
    
    // Digitar e enviar mensagem
    console.log('✍️ Enviando mensagem...');
    const textarea = await page.locator('textarea');
    await textarea.fill('Teste detalhado');
    
    const sendButton = await page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Aguardar e verificar mudanças
    console.log('⏳ Aguardando mudanças na interface...');
    await page.waitForTimeout(3000);
    
    // Verificar se mensagem do usuário apareceu
    const userMessage = await page.locator('text="Teste detalhado"').count();
    console.log(`👤 Mensagem do usuário visível: ${userMessage > 0}`);
    
    // Verificar estado das threads/conversas
    const threads = await page.locator('[data-testid="thread"], .thread, .conversation').count();
    console.log(`🧵 Threads/conversas: ${threads}`);
    
    // Aguardar mais tempo para resposta
    console.log('⏳ Aguardando resposta...');
    await page.waitForTimeout(10000);
    
    // Verificar mensagens finais
    if (messageAreaExists) {
      const finalMessages = await messageArea.locator('.message, [role="message"], [data-role]').count();
      console.log(`📊 Mensagens finais: ${finalMessages}`);
    }
    
    // Verificar localStorage para debug
    const localStorage = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const data = {};
      keys.forEach(key => {
        try {
          data[key] = JSON.parse(localStorage[key]);
        } catch {
          data[key] = localStorage[key];
        }
      });
      return data;
    });
    console.log('💾 LocalStorage:', JSON.stringify(localStorage, null, 2));
    
    await page.screenshot({ path: 'detailed-test.png', fullPage: true });
    
  } catch (error) {
    console.log('💥 ERRO:', error.message);
    await page.screenshot({ path: 'detailed-error.png' });
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();