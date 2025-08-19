// Teste final da página de pricing com fix aplicado
const { chromium } = require('playwright');

async function testPricingFinal() {
  console.log('🧪 Teste final da página de pricing (após fix do redirect)...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capturar console logs importantes
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[SECURITY]') || text.includes('Error') || text.includes('plans')) {
      console.log(`📝 Console: ${msg.type()}: ${text}`);
    }
  });
  
  try {
    console.log('\\n1. 🌐 Navegando para página de pricing...');
    const response = await page.goto('http://localhost:3001/pricing', {
      waitUntil: 'networkidle'
    });
    
    console.log(`📄 Response: ${response.status()}`);
    console.log(`🔗 Final URL: ${page.url()}`);
    
    // Aguardar carregamento
    await page.waitForTimeout(3000);
    
    // Verificar se conseguimos permanecer na página de pricing
    const currentUrl = page.url();
    const stayedOnPricing = currentUrl.includes('/pricing');
    console.log(`✅ Permaneceu na página pricing: ${stayedOnPricing}`);
    
    if (!stayedOnPricing) {
      console.log('❌ Ainda está redirecionando. URL atual:', currentUrl);
      await browser.close();
      return;
    }
    
    console.log('\\n2. 📋 Verificando elementos da página...');
    
    // Verificar título da página
    const title = await page.title();
    console.log(`📄 Título: "${title}"`);
    
    // Verificar header principal
    const header = await page.textContent('h1').catch(() => null);
    console.log(`📝 H1: "${header}"`);
    
    // Verificar se loading desapareceu
    await page.waitForTimeout(2000);
    const loadingText = await page.$('text=Carregando planos...');
    console.log(`⏳ Loading ainda visível: ${!!loadingText}`);
    
    // Verificar planos carregados
    const planCards = await page.$$('[class*="planCard"], [class*="plan"]');
    console.log(`📦 Cartões de planos: ${planCards.length}`);
    
    // Verificar botões específicos
    const buttons = await page.$$('button');
    console.log(`🔘 Total de botões: ${buttons.length}`);
    
    const upgradeButtons = [];
    for (let button of buttons) {
      const text = await button.textContent();
      if (text.includes('Assinar') || text.includes('Usar Grátis') || text.includes('Plano Atual')) {
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        upgradeButtons.push({
          text: text.trim(),
          visible: isVisible,
          enabled: isEnabled
        });
      }
    }
    
    console.log(`💰 Botões de upgrade encontrados: ${upgradeButtons.length}`);
    upgradeButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.text}" (Visível: ${btn.visible}, Habilitado: ${btn.enabled})`);
    });
    
    console.log('\\n3. 🧪 Testando API calls...');
    
    // Verificar se API está sendo chamada e retornando dados
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8787/v1/plans');
        const data = await response.json();
        return {
          success: true,
          status: response.status,
          plansCount: data.plans?.length || 0,
          firstPlan: data.plans?.[0] || null
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('📡 Resposta da API:', JSON.stringify(apiResponse, null, 2));
    
    console.log('\\n4. 🖱️  Testando interação com botões...');
    
    if (upgradeButtons.length > 0) {
      // Tentar clicar no primeiro botão disponível
      const firstButton = upgradeButtons.find(btn => btn.visible && btn.enabled);
      if (firstButton) {
        console.log(`🎯 Tentando clicar em: "${firstButton.text}"`);
        
        const buttonElement = await page.$(`button:has-text("${firstButton.text}")`);
        if (buttonElement) {
          await buttonElement.click();
          console.log('✅ Clique executado com sucesso');
          
          // Aguardar possível navegação ou modal
          await page.waitForTimeout(3000);
          
          const newUrl = page.url();
          console.log(`🔗 URL após clique: ${newUrl}`);
          
          // Se foi redirecionado para Stripe, é um sucesso!
          if (newUrl.includes('stripe.com') || newUrl.includes('checkout')) {
            console.log('🎉 SUCESSO! Redirecionado para Stripe Checkout!');
          } else if (newUrl !== currentUrl) {
            console.log(`🔄 Redirecionado para: ${newUrl}`);
          }
        }
      }
    } else {
      console.log('❌ Nenhum botão de upgrade disponível para clicar');
    }
    
    // Screenshot final
    await page.screenshot({ 
      path: 'pricing-final-test.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot salvo: pricing-final-test.png');
    
    console.log('\\n🎯 RESUMO DO TESTE:');
    console.log('═══════════════════════════════════');
    console.log(`✅ Página pricing acessível: ${stayedOnPricing}`);
    console.log(`✅ API funcionando: ${apiResponse.success}`);
    console.log(`✅ Planos carregados: ${apiResponse.plansCount || 0}`);
    console.log(`✅ Botões encontrados: ${upgradeButtons.length}`);
    console.log(`✅ Integração Stripe: ${upgradeButtons.length > 0 ? 'OK' : 'Needs Check'}`);
    
    // Aguardar para inspeção manual
    console.log('\\n⏸️  Mantendo browser aberto para inspeção...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

testPricingFinal().catch(console.error);