const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🟢 Testando aplicação após rollback...');
    
    // Navegar para homepage
    console.log('📍 Navegando para homepage...');
    await page.goto('http://localhost:3001');
    
    // Esperar a página carregar
    await page.waitForTimeout(2000);
    
    // Verificar se sidebar existe
    const sidebar = await page.locator('.sidebar, [data-testid="sidebar"]').first();
    const sidebarExists = await sidebar.count() > 0;
    console.log('📱 Sidebar presente:', sidebarExists);
    
    // Verificar se textarea de input existe
    const textarea = await page.locator('textarea').first();
    const textareaExists = await textarea.count() > 0;
    console.log('📝 Textarea presente:', textareaExists);
    
    // Verificar se não há erros evidentes na página
    const errorElements = await page.locator('.error, [class*="error"]').count();
    console.log('❌ Elementos de erro encontrados:', errorElements);
    
    // Teste básico: digite uma mensagem
    if (textareaExists) {
      console.log('✍️ Testando input de mensagem...');
      await textarea.fill('Teste de funcionamento após rollback');
      await page.waitForTimeout(500);
      
      // Procurar botão de envio
      const sendButton = await page.locator('button[type="submit"], [aria-label*="Send"], [aria-label*="Enviar"]').first();
      const sendExists = await sendButton.count() > 0;
      console.log('📤 Botão de envio presente:', sendExists);
      
      if (sendExists) {
        console.log('🚀 Enviando mensagem de teste...');
        await sendButton.click();
        await page.waitForTimeout(3000);
        
        // Verificar se loading aparece
        const loadingIndicator = await page.locator('.loading-dots, [data-testid*="loading"]').count();
        console.log('⏳ Indicador de loading encontrado:', loadingIndicator > 0);
      }
    }
    
    // Screenshot final
    await page.screenshot({ path: 'rollback-test-result.png', fullPage: true });
    console.log('📸 Screenshot salvo: rollback-test-result.png');
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  } finally {
    await browser.close();
  }
})();