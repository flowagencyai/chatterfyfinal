// Teste simples da página de pricing
const { chromium } = require('playwright');

async function testPricingSimple() {
  console.log('🧪 Teste simples da página de pricing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('\\n📄 Navegando para pricing...');
    await page.goto('http://localhost:3001/pricing');
    
    console.log(`🔗 URL atual: ${page.url()}`);
    
    // Aguardar um pouco
    await page.waitForTimeout(5000);
    
    console.log(`🔗 URL após aguardar: ${page.url()}`);
    
    // Verificar se há elementos na página
    const title = await page.title();
    console.log(`📄 Título: "${title}"`);
    
    // Procurar por texto específico da página de pricing
    const pricingTexts = [
      'Escolha o plano ideal',
      'pricing',
      'planos',
      'Grátis',
      'Pro'
    ];
    
    for (const text of pricingTexts) {
      const found = await page.$(`text=${text}`).catch(() => null);
      console.log(`🔍 Encontrado "${text}": ${!!found}`);
    }
    
    // Verificar botões
    const buttons = await page.$$('button');
    console.log(`🔘 Total de botões: ${buttons.length}`);
    
    // Aguardar mais um pouco e fazer screenshot
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'pricing-simple-test.png', fullPage: true });
    console.log('📸 Screenshot salvo');
    
    // Aguardar para visualização
    console.log('\\n⏸️  Aguardando para visualização manual...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

testPricingSimple().catch(console.error);