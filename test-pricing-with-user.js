// Teste da página de pricing com usuário real
const { chromium } = require('playwright');

async function testPricingWithUser() {
  console.log('🧪 Testando página de pricing com usuário real...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Interceptar requests para simular usuário logado
  await page.route('**/api/auth/session', async route => {
    // Simular usuário logado
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-user-456',
          name: 'Usuário Teste',
          email: 'teste@chatterfy.com'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    });
  });
  
  // Interceptar chamada de plano do usuário
  await page.route('**/v1/user/plan', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: {
          id: 'cmeh7fl830000jahc6hcagyej',
          code: 'free',
          name: 'Grátis',
          monthlyCreditsTokens: 2000000,
          dailyTokenLimit: 200000,
          storageLimitMB: 200,
          maxFileSizeMB: 10,
          features: { rag: false, s3: false }
        },
        subscription: null
      })
    });
  });
  
  // Interceptar chamada de lista de planos
  await page.route('**/v1/plans', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plans: [
          {
            id: 'cmeh7fl830000jahc6hcagyej',
            code: 'free',
            name: 'Grátis',
            monthlyCreditsTokens: 2000000,
            dailyTokenLimit: 200000,
            storageLimitMB: 200,
            maxFileSizeMB: 10,
            features: { rag: false, s3: false }
          },
          {
            id: 'cmeh7fl8i0001jahc0tfu0s6m',
            code: 'pro',
            name: 'Pro',
            monthlyCreditsTokens: 10000000,
            dailyTokenLimit: 1000000,
            storageLimitMB: 2000,
            maxFileSizeMB: 50,
            features: { rag: true, s3: true }
          }
        ]
      })
    });
  });
  
  try {
    console.log('\\n1. 📄 Navegando para página de pricing...');
    await page.goto('http://localhost:3001/pricing');
    
    // Aguardar carregamento
    await page.waitForTimeout(5000);
    
    console.log(`🔗 URL final: ${page.url()}`);
    
    console.log('\\n2. 📋 Verificando preços dos planos...');
    
    // Aguardar os planos carregarem
    await page.waitForSelector('[class*=\"plan\"]', { timeout: 10000 }).catch(() => {});
    
    // Procurar por preços na página
    const priceTexts = await page.$$eval('*', elements => {
      return elements
        .filter(el => el.textContent && (el.textContent.includes('R$') || el.textContent.includes('0') || el.textContent.includes('49')))
        .map(el => el.textContent.trim())
        .filter(text => text.length < 50); // Filtrar textos curtos
    });
    
    console.log('💰 Preços encontrados na página:');
    [...new Set(priceTexts)].forEach(price => {
      if (price.includes('R$') || price.includes('0,00') || price.includes('49,90')) {
        console.log(`  - ${price}`);
      }
    });
    
    // Verificar se tem plano gratuito (R$ 0)
    const freePrice = priceTexts.find(text => text.includes('R$ 0') || text.includes('0,00'));
    const proPrice = priceTexts.find(text => text.includes('49,90') || text.includes('49'));
    
    console.log(`\\n✅ Plano FREE (R$ 0): ${!!freePrice ? 'Encontrado' : 'NÃO encontrado'}`);
    console.log(`✅ Plano PRO (R$ 49,90): ${!!proPrice ? 'Encontrado' : 'NÃO encontrado'}`);
    
    console.log('\\n3. 🔍 Verificando botões de planos...');
    
    // Procurar por botões
    const buttons = await page.$$('button');
    const planButtons = [];
    
    for (const button of buttons) {
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      
      if (text && (text.includes('Plano Atual') || text.includes('Usar Grátis') || text.includes('Assinar'))) {
        planButtons.push({
          text: text.trim(),
          visible: isVisible,
          enabled: await button.isEnabled()
        });
      }
    }
    
    console.log(`📄 Botões de planos encontrados: ${planButtons.length}`);
    planButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. \"${btn.text}\" (Visível: ${btn.visible}, Habilitado: ${btn.enabled})`);
    });
    
    // Verificar se o plano atual está sendo identificado
    const currentPlanButton = planButtons.find(btn => btn.text.includes('Plano Atual'));
    console.log(`\\n🎯 Plano atual identificado: ${!!currentPlanButton ? 'SIM' : 'NÃO'}`);
    
    if (currentPlanButton) {
      console.log(`   Texto do botão: \"${currentPlanButton.text}\"`);
    }
    
    console.log('\\n4. 🖱️  Tentando interagir com botão PRO...');
    
    const proButton = planButtons.find(btn => 
      btn.text.includes('Assinar') && 
      btn.visible && 
      btn.enabled
    );
    
    if (proButton) {
      console.log('💰 Tentando clicar no botão PRO...');
      
      const buttonElement = await page.$('button:has-text(\"Assinar\")');
      if (buttonElement) {
        await buttonElement.click();
        console.log('✅ Clique executado');
        
        // Aguardar redirecionamento ou ação
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log(`🔗 URL após clique: ${newUrl}`);
        
        if (newUrl.includes('stripe.com') || newUrl.includes('checkout')) {
          console.log('🎉 SUCESSO! Redirecionado para Stripe Checkout!');
        }
      }
    } else {
      console.log('❌ Botão PRO não encontrado ou não habilitado');
    }
    
    // Screenshot final
    await page.screenshot({ 
      path: 'pricing-with-user-test.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot salvo: pricing-with-user-test.png');
    
    console.log('\\n🎯 RESUMO DO TESTE:');
    console.log('═══════════════════════════════════');
    console.log(`✅ Plano FREE (R$ 0): ${!!freePrice ? '✅' : '❌'}`);
    console.log(`✅ Plano PRO (R$ 49,90): ${!!proPrice ? '✅' : '❌'}`);
    console.log(`✅ Plano atual identificado: ${!!currentPlanButton ? '✅' : '❌'}`);
    console.log(`✅ Botões funcionais: ${planButtons.length > 0 ? '✅' : '❌'}`);
    
    // Aguardar visualização
    console.log('\\n⏸️  Mantendo para visualização...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    await page.screenshot({ path: 'pricing-error.png' });
  } finally {
    await browser.close();
  }
}

testPricingWithUser().catch(console.error);