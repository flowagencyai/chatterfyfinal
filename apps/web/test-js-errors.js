const { chromium } = require('playwright');

(async () => {
  console.log('🐛 Caçando erros JavaScript...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  const errors = [];
  const requests = [];
  
  // Capturar TODOS os erros
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const error = msg.text();
      errors.push(error);
      console.log(`🚨 ERRO JS: ${error}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`💥 ERRO DE PÁGINA: ${error.message}`);
    errors.push(`PAGE ERROR: ${error.message}`);
  });
  
  // Capturar todas as requisições
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📊 Requisições até agora:', requests.length);
    
    // Preencher e enviar
    const textarea = await page.locator('textarea');
    await textarea.fill('Debug test');
    
    console.log('🎯 Clicando no botão enviar...');
    const sendButton = await page.locator('button[type="submit"]');
    
    // Aguardar um pouco antes de clicar
    await page.waitForTimeout(1000);
    
    await sendButton.click();
    
    console.log('⏳ Aguardando após envio...');
    await page.waitForTimeout(5000);
    
    console.log('📊 Total de requisições:', requests.length);
    console.log('🚨 Total de erros:', errors.length);
    
    // Mostrar requisições relevantes
    const chatRequests = requests.filter(r => 
      r.url.includes('chat') || 
      r.url.includes('v1/') || 
      r.url.includes('8787')
    );
    
    console.log('💬 Requisições de chat:', chatRequests);
    
    if (errors.length > 0) {
      console.log('🚨 LISTA DE ERROS:');
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
  } catch (error) {
    console.log('💥 ERRO DURANTE TESTE:', error.message);
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
  
  if (errors.length === 0) {
    console.log('✅ Nenhum erro JavaScript encontrado!');
  } else {
    console.log(`❌ ${errors.length} erros encontrados!`);
  }
})();