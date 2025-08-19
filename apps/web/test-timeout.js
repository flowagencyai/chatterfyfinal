const { chromium } = require('playwright');

(async () => {
  console.log('⏱️ Teste de timeout - aguardando até 60 segundos...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  const responses = [];
  
  page.on('response', async response => {
    if (response.url().includes('chat/anonymous')) {
      console.log(`📥 RESPOSTA RECEBIDA: ${response.status()} em ${new Date().toLocaleTimeString()}`);
      try {
        const body = await response.text();
        console.log(`📄 TAMANHO DA RESPOSTA: ${body.length} caracteres`);
        
        if (body.length > 100) {
          const preview = body.substring(0, 200) + '...';
          console.log(`📄 PREVIEW: ${preview}`);
        }
        
        responses.push({
          status: response.status(),
          body: body.substring(0, 500),
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.log(`❌ Erro ao ler resposta: ${e.message}`);
      }
    }
  });
  
  // Monitorar mudanças na DOM
  page.on('console', msg => {
    if (msg.type() === 'log' && msg.text().includes('Adding')) {
      console.log(`🔄 DOM UPDATE: ${msg.text()}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Enviar mensagem
    console.log(`📤 ENVIANDO MENSAGEM EM: ${new Date().toLocaleTimeString()}`);
    await page.fill('textarea', 'Teste timeout longo');
    await page.click('button[type="submit"]');
    
    // Aguardar até 60 segundos pela resposta
    console.log('⏳ Aguardando resposta por até 60 segundos...');
    
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1000);
      
      // Verificar se apareceu mensagem do assistente
      const assistantMessage = await page.locator('[data-role="assistant"], .assistant-message, .message-assistant').count();
      const allMessages = await page.locator('.message, [role="message"]').count();
      
      if (assistantMessage > 0) {
        console.log(`✅ RESPOSTA APARECEU após ${i + 1} segundos!`);
        break;
      }
      
      if (i % 5 === 0) { // Log a cada 5 segundos
        console.log(`⏳ ${i + 1}s - Mensagens na tela: ${allMessages}, Respostas: ${responses.length}`);
      }
    }
    
    // Verificar estado final
    const finalMessages = await page.locator('.message, [role="message"]').count();
    const assistantMessages = await page.locator('[data-role="assistant"], .assistant-message, .message-assistant').count();
    
    console.log(`📊 RESULTADO FINAL:`);
    console.log(`  - Mensagens totais: ${finalMessages}`);
    console.log(`  - Mensagens do assistente: ${assistantMessages}`);
    console.log(`  - Respostas HTTP recebidas: ${responses.length}`);
    
    if (responses.length > 0) {
      console.log(`📄 ÚLTIMA RESPOSTA:`, responses[responses.length - 1]);
    }
    
    await page.screenshot({ path: 'timeout-test-final.png', fullPage: true });
    
  } catch (error) {
    console.log('💥 ERRO:', error.message);
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();