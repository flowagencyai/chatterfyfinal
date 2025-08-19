// Teste da página de pricing com Playwright
const { chromium } = require('playwright');

async function testPricingPage() {
  console.log('🧪 Testando página de pricing com Playwright...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Deixar mais lento para visualizar
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('\n1. 📄 Navegando para página de pricing...');
    await page.goto('http://localhost:3001/pricing');
    
    // Aguardar carregamento
    console.log('⏳ Aguardando carregamento da página...');
    await page.waitForTimeout(3000);
    
    // Verificar se a página carregou
    const title = await page.title();
    console.log(`📄 Título da página: ${title}`);
    
    // Verificar se os planos estão carregando
    console.log('\n2. 🔍 Verificando elementos da página...');
    
    // Procurar por indicador de loading
    const loadingExists = await page.$('text=Carregando planos...');
    if (loadingExists) {
      console.log('⏳ Página ainda está carregando planos...');
      await page.waitForTimeout(5000);
    }
    
    // Verificar header
    const header = await page.$('text=Escolha o plano ideal para você');
    console.log(`📋 Header encontrado: ${!!header}`);
    
    // Verificar se existem cartões de planos
    const planCards = await page.$$('[class*="planCard"]');
    console.log(`📦 Cartões de planos encontrados: ${planCards.length}`);
    
    // Verificar botões especificamente
    const buttons = await page.$$('button');
    console.log(`🔘 Botões encontrados na página: ${buttons.length}`);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      const isEnabled = await buttons[i].isEnabled();
      console.log(`  - Botão ${i + 1}: "${buttonText}" (Visível: ${isVisible}, Habilitado: ${isEnabled})`);
    }
    
    // Procurar por botões de upgrade específicos
    const upgradeButtons = await page.$$('button:has-text("Assinar"), button:has-text("Usar Grátis"), button:has-text("Plano Atual")');
    console.log(`💰 Botões de upgrade encontrados: ${upgradeButtons.length}`);
    
    // Verificar se há erros no console
    console.log('\n3. 🔍 Verificando erros no console...');
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Aguardar um pouco mais para capturar logs
    await page.waitForTimeout(2000);
    
    consoleLogs.forEach(log => {
      if (log.includes('error') || log.includes('Error')) {
        console.log(`❌ Console Error: ${log}`);
      } else {
        console.log(`📝 Console: ${log}`);
      }
    });
    
    // Verificar network requests
    console.log('\n4. 🌐 Verificando requisições de API...');
    let apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/v1/plans') || response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Recarregar página para capturar requisições
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log(`📡 Requisições API capturadas: ${apiCalls.length}`);
    apiCalls.forEach(call => {
      console.log(`  - ${call.url}: ${call.status} ${call.statusText}`);
    });
    
    // Tentar clicar em um botão de upgrade se existir
    console.log('\n5. 🖱️  Tentando interagir com botões...');
    
    try {
      const freeButton = await page.$('button:has-text("Usar Grátis")');
      const proButton = await page.$('button:has-text("Assinar")');
      
      if (freeButton) {
        console.log('🆓 Botão FREE encontrado, tentando clicar...');
        await freeButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clique no botão FREE executado');
      } else if (proButton) {
        console.log('💰 Botão PRO encontrado, tentando clicar...');
        await proButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clique no botão PRO executado');
      } else {
        console.log('❌ Nenhum botão de upgrade encontrado para clicar');
      }
    } catch (error) {
      console.log(`❌ Erro ao clicar no botão: ${error.message}`);
    }
    
    // Screenshot para debug
    await page.screenshot({ path: 'pricing-page-debug.png', fullPage: true });
    console.log('📸 Screenshot salvo: pricing-page-debug.png');
    
    // Verificar se existe StripeProvider
    console.log('\n6. 🔒 Verificando StripeProvider...');
    const stripeScript = await page.$('script[src*="stripe"]');
    console.log(`🔧 Script do Stripe carregado: ${!!stripeScript}`);
    
    // Manter página aberta para inspeção manual
    console.log('\n⏸️  Página mantida aberta para inspeção manual...');
    console.log('Pressione Ctrl+C para fechar quando terminar de inspecionar');
    
    // Aguardar 30 segundos para inspeção manual
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    console.log('\n🔒 Fechando browser...');
    await browser.close();
  }
}

// Executar teste
testPricingPage().catch(console.error);