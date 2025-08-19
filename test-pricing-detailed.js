// Teste detalhado da página de pricing
const { chromium } = require('playwright');

async function testPricingDetailed() {
  console.log('🧪 Teste detalhado da página de pricing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capturar todos os requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method()
    });
  });
  
  // Capturar responses
  const responses = [];
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
  });
  
  // Capturar console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  try {
    console.log('\\n1. 🌐 Navegando para http://localhost:3001/pricing...');
    
    const response = await page.goto('http://localhost:3001/pricing', {
      waitUntil: 'networkidle'
    });
    
    console.log(`📄 Response status: ${response.status()}`);
    console.log(`🔗 Final URL: ${page.url()}`);
    
    // Aguardar carregamento completo
    await page.waitForTimeout(5000);
    
    console.log('\\n2. 📋 Analisando conteúdo da página...');
    
    const pageTitle = await page.title();
    console.log(`📄 Title: "${pageTitle}"`);
    
    const h1Elements = await page.$$('h1');
    console.log(`📝 H1 elements: ${h1Elements.length}`);
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`  - H1 ${i + 1}: "${text}"`);
    }
    
    // Verificar se a API está sendo chamada corretamente
    console.log('\\n3. 📡 Verificando chamadas de API...');
    const apiRequests = requests.filter(r => r.url.includes('/v1/plans'));
    console.log(`🔍 Requests para /v1/plans: ${apiRequests.length}`);
    apiRequests.forEach(req => {
      console.log(`  - ${req.method} ${req.url}`);
    });
    
    const apiResponses = responses.filter(r => r.url.includes('/v1/plans'));
    console.log(`📨 Responses de /v1/plans: ${apiResponses.length}`);
    apiResponses.forEach(res => {
      console.log(`  - ${res.status} ${res.statusText}: ${res.url}`);
    });
    
    // Verificar se existe erro de environment variable
    console.log('\\n4. 🔍 Verificando console logs...');
    consoleLogs.forEach(log => {
      console.log(`  📝 ${log}`);
    });
    
    // Testar a API diretamente do browser
    console.log('\\n5. 🧪 Testando API diretamente do browser...');
    
    const apiTest = await page.evaluate(async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || window.location.origin;
        console.log('API Base:', apiBase);
        
        const response = await fetch(`${apiBase}/v1/plans`);
        const data = await response.json();
        
        return {
          success: true,
          apiBase: apiBase,
          status: response.status,
          data: data
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('🧪 Resultado do teste de API:', JSON.stringify(apiTest, null, 2));
    
    // Verificar se os elementos da página existem
    console.log('\\n6. 🎯 Verificando elementos específicos...');
    
    const loadingElement = await page.$('text=Carregando planos...');
    console.log(`⏳ Loading indicator: ${!!loadingElement}`);
    
    const pricingElements = await page.$('[class*="pricing"], [class*="plan"]');
    console.log(`💰 Pricing elements: ${!!pricingElements}`);
    
    // Forçar uma chamada manual para a API
    console.log('\\n7. 🔧 Forçando chamada manual para API...');
    
    const manualApiCall = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8787/v1/plans');
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('🔧 Resultado da chamada manual:', JSON.stringify(manualApiCall, null, 2));
    
    // Screenshot
    await page.screenshot({ 
      path: 'pricing-detailed-debug.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot salvo: pricing-detailed-debug.png');
    
    // Aguardar para inspeção manual
    console.log('\\n⏸️  Mantendo página aberta para inspeção...');
    console.log('Você pode inspecionar a página no browser aberto');
    console.log('Pressione Enter para continuar...');
    
    // Aguardar 20 segundos para inspeção
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
}

testPricingDetailed().catch(console.error);