const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando teste automatizado do chat...');
  
  const browser = await chromium.launch({ 
    headless: false, // Para ver o que está acontecendo
    slowMo: 1000 // Slow down para debug
  });
  
  const page = await browser.newPage();
  
  // Interceptar erros do console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ ERRO NO CONSOLE:', msg.text());
    } else if (msg.type() === 'log') {
      console.log('📝 LOG:', msg.text());
    }
  });
  
  // Interceptar requisições de rede
  page.on('response', response => {
    if (response.url().includes('/chat/') || response.url().includes('/v1/')) {
      console.log(`🌐 ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🌍 Navegando para http://localhost:3001');
    await page.goto('http://localhost:3001');
    
    console.log('⏳ Aguardando página carregar...');
    await page.waitForLoadState('networkidle');
    
    // Verificar se o textarea está presente
    console.log('🔍 Procurando campo de texto...');
    const textarea = await page.locator('textarea[placeholder*="Envie uma mensagem"]');
    await textarea.waitFor({ timeout: 10000 });
    
    console.log('✍️ Digitando mensagem de teste...');
    await textarea.fill('Olá, este é um teste automatizado com Playwright!');
    
    console.log('🔍 Procurando botão enviar...');
    const sendButton = await page.locator('button[type="submit"]').or(page.locator('button[aria-label="Send message"]'));
    
    console.log('📤 Enviando mensagem...');
    await sendButton.click();
    
    console.log('⏳ Aguardando resposta do sistema...');
    
    // Aguardar pela resposta do assistente (até 30 segundos)
    try {
      await page.waitForSelector('[data-role="assistant"], .message-assistant, .assistant-message', { 
        timeout: 30000 
      });
      console.log('✅ SUCESSO: Resposta do assistente apareceu!');
    } catch (e) {
      console.log('❌ ERRO: Resposta do assistente não apareceu em 30s');
      
      // Verificar se há mensagens na tela
      const messages = await page.locator('.message, [role="message"]').count();
      console.log(`📊 Total de mensagens visíveis: ${messages}`);
      
      // Verificar se há loading indicators
      const loading = await page.locator('.loading, .spinner, [data-loading]').count();
      console.log(`⏳ Indicadores de loading: ${loading}`);
      
      // Capturar screenshot para debug
      await page.screenshot({ path: 'debug-chat-error.png' });
      console.log('📸 Screenshot salvo: debug-chat-error.png');
    }
    
    // Aguardar mais um pouco para ver se algo muda
    await page.waitForTimeout(5000);
    
    // Verificar estado final
    const finalMessages = await page.locator('.message, [role="message"]').count();
    console.log(`📊 Mensagens finais na tela: ${finalMessages}`);
    
    // Capturar screenshot final
    await page.screenshot({ path: 'final-state.png' });
    console.log('📸 Screenshot final salvo: final-state.png');
    
  } catch (error) {
    console.log('💥 ERRO DURANTE O TESTE:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Screenshot de erro salvo: error-screenshot.png');
  }
  
  console.log('🏁 Mantendo navegador aberto por 10 segundos para inspeção...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('🎬 Teste finalizado!');
})();