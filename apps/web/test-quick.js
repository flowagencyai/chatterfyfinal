const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('[ChatContext]')) {
      console.log(`🟡 ${msg.text()}`);
    }
  });
  
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  
  console.log('📤 Enviando mensagem...');
  await page.fill('textarea', 'Teste rápido');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(15000);
  await browser.close();
})();