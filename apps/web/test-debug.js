const { chromium } = require('playwright');

(async () => {
  console.log('🐛 Teste de debug com logs detalhados...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  const logs = [];
  
  // Capturar TODOS os logs do console
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`${msg.type().toUpperCase()}: ${text}`);
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('\n🎯 ENVIANDO MENSAGEM...\n');
    
    await page.fill('textarea', 'Debug com logs');
    await page.click('button[type="submit"]');
    
    console.log('\n⏳ AGUARDANDO 30 SEGUNDOS PARA VER LOGS...\n');
    await page.waitForTimeout(30000);
    
    console.log('\n📊 VERIFICANDO ESTADO FINAL...\n');
    
    // Verificar se há mensagens na tela
    const allMessages = await page.locator('.message, [role="message"]').count();
    const userMessages = await page.locator('[data-role="user"], .user-message').count();
    const assistantMessages = await page.locator('[data-role="assistant"], .assistant-message').count();
    
    console.log(`📈 Mensagens totais: ${allMessages}`);
    console.log(`👤 Mensagens do usuário: ${userMessages}`);
    console.log(`🤖 Mensagens do assistente: ${assistantMessages}`);
    
    // Verificar LocalStorage
    const localStorage = await page.evaluate(() => {
      const threads = localStorage.getItem('chat_threads_anon_' + localStorage.getItem('anonymous_session_id'));
      return threads ? JSON.parse(threads) : null;
    });
    
    if (localStorage) {
      console.log(`💾 Threads no localStorage: ${localStorage.length}`);
      if (localStorage.length > 0) {
        console.log(`💾 Mensagens na última thread: ${localStorage[0].messages.length}`);
      }
    }
    
    console.log('\n📝 LOGS RELEVANTES (filtrados):');
    const relevantLogs = logs.filter(log => 
      log.includes('[DEBUG]') || 
      log.includes('[ChatContext]') ||
      log.includes('addMessage') ||
      log.includes('assistant') ||
      log.includes('error')
    );
    
    relevantLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    
  } catch (error) {
    console.log('💥 ERRO:', error.message);
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();