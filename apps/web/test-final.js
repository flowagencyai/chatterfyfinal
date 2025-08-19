const { chromium } = require('playwright');

(async () => {
  console.log('🎯 TESTE FINAL - verificando se bugfix funcionou...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  let assistantMessageReceived = false;
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[ChatContext]')) {
      console.log(`🟡 ${text}`);
      
      if (text.includes('role: assistant') && text.includes('addMessage chamado')) {
        assistantMessageReceived = true;
      }
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('\n📤 ENVIANDO MENSAGEM...\n');
    await page.fill('textarea', 'Teste final bugfix');
    await page.click('button[type="submit"]');
    
    console.log('⏳ Aguardando resposta do assistente...');
    
    // Aguardar até resposta do assistente chegar
    for (let i = 0; i < 40; i++) { // 40 segundos max
      await page.waitForTimeout(1000);
      
      if (assistantMessageReceived) {
        console.log(`✅ Resposta do assistente recebida após ${i + 1} segundos!`);
        break;
      }
      
      if (i % 5 === 0) {
        console.log(`⏳ ${i + 1}s - aguardando...`);
      }
    }
    
    // Aguardar mais um pouco para processamento
    await page.waitForTimeout(3000);
    
    console.log('\n📊 VERIFICANDO RESULTADO FINAL...\n');
    
    // Verificar mensagens na tela
    const allMessages = await page.locator('.message, [role="message"]').count();
    const userMessages = await page.locator('[data-role="user"], .user-message').count();
    const assistantMessages = await page.locator('[data-role="assistant"], .assistant-message').count();
    
    console.log(`📈 Mensagens totais na UI: ${allMessages}`);
    console.log(`👤 Mensagens do usuário na UI: ${userMessages}`);  
    console.log(`🤖 Mensagens do assistente na UI: ${assistantMessages}`);
    
    // Verificar localStorage
    const localStorage = await page.evaluate(() => {
      const sessionId = localStorage.getItem('anonymous_session_id');
      const threads = localStorage.getItem('chat_threads_' + sessionId);
      return threads ? JSON.parse(threads) : [];
    });
    
    console.log(`💾 Threads no localStorage: ${localStorage.length}`);
    if (localStorage.length > 0) {
      console.log(`💾 Mensagens na thread: ${localStorage[0].messages.length}`);
      localStorage[0].messages.forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
      });
    }
    
    // Resultado final
    if (assistantMessages > 0 || (localStorage.length > 0 && localStorage[0].messages.length > 1)) {
      console.log('\n🎉 SUCESSO! O chat está funcionando!');
    } else {
      console.log('\n❌ AINDA HÁ PROBLEMAS. Mensagens não aparecem na UI.');
    }
    
  } catch (error) {
    console.log('💥 ERRO:', error.message);
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();