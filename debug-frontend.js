const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capturar logs do console
  page.on('console', msg => {
    console.log('🖥️ [Frontend]:', msg.text());
  });
  
  // Capturar requisições de rede
  page.on('request', request => {
    if (request.url().includes('/chat') || request.url().includes('/anonymous')) {
      console.log('🌐 [Request]:', request.method(), request.url());
      console.log('   Body:', request.postData() || 'N/A');
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/chat') || response.url().includes('/anonymous')) {
      console.log('🌐 [Response]:', response.status(), response.url());
    }
  });
  
  console.log('🚀 Navegando para http://localhost:3001');
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(3000);
  
  console.log('📝 Preenchendo mensagem');
  await page.fill('textarea', 'teste de debug');
  
  console.log('⏎ Enviando mensagem');
  await page.press('textarea', 'Enter');
  
  console.log('⏳ Aguardando 10 segundos...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();