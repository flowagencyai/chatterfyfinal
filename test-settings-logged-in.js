const { chromium } = require('playwright');

async function testSettingsModalLoggedIn() {
  console.log('🔧 Conectando ao seu navegador logado para testar modal de configurações...');
  
  // Conectar ao navegador existente (Chrome/Chromium)
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();
  
  try {
    // Navegar para a página se necessário
    console.log('📍 Navegando/atualizando página...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Procurar botão de configurações/settings
    console.log('⚙️ Procurando botão de configurações...');
    
    const settingsSelectors = [
      'button[aria-label*="Settings"]',
      'button[aria-label*="Configurações"]', 
      'button[title*="Settings"]',
      'button[title*="Configurações"]',
      'button:has-text("⚙️")',
      'button:has-text("Settings")',
      'button:has-text("Configurações")',
      '[data-testid="settings"]',
      'button svg[viewBox="0 0 24 24"] path[d*="19.4"]', // Ícone típico de settings
      'button svg[viewBox="0 0 24 24"]:has(circle[cx="12"][cy="12"][r="3"])', // Outro ícone comum
    ];
    
    let settingsButton = null;
    for (const selector of settingsSelectors) {
      try {
        settingsButton = await page.$(selector);
        if (settingsButton) {
          console.log(`✅ Botão de configurações encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Se não encontrou, procurar por posição ou contexto
    if (!settingsButton) {
      console.log('🔍 Procurando botões que podem ser de configurações...');
      
      const allButtons = await page.$$('button');
      console.log(`Encontrados ${allButtons.length} botões`);
      
      for (let i = 0; i < allButtons.length; i++) {
        const btn = allButtons[i];
        const text = await btn.textContent();
        const ariaLabel = await btn.getAttribute('aria-label');
        const title = await btn.getAttribute('title');
        
        if (text || ariaLabel || title) {
          console.log(`Botão ${i}: "${text}" | aria-label="${ariaLabel}" | title="${title}"`);
        }
        
        // Procurar por palavras-chave
        const content = (text + ' ' + (ariaLabel || '') + ' ' + (title || '')).toLowerCase();
        if (content.includes('config') || content.includes('setting') || content.includes('gear')) {
          settingsButton = btn;
          console.log(`✅ Botão de configurações encontrado por contexto!`);
          break;
        }
      }
    }
    
    if (!settingsButton) {
      console.log('❌ Botão de configurações não encontrado. Vou tentar encontrar manual...');
      console.log('Por favor, manualmente clique no botão de configurações ou pressione uma tecla para continuar...');
      await page.waitForTimeout(10000);
    } else {
      // Abrir modal de configurações
      console.log('🔓 Abrindo modal de configurações...');
      await settingsButton.click();
      await page.waitForTimeout(1500);
    }
    
    // Verificar se modal abriu
    const modal = await page.$('[role="dialog"], .modal, div:has-text("Configurações"):visible');
    if (!modal) {
      console.log('❌ Modal não encontrado. Aguardando abertura manual...');
      await page.waitForTimeout(5000);
    }
    
    console.log('\n🧪 INICIANDO TESTES DE FUNCIONALIDADE...\n');
    
    const testResults = {};
    
    // Teste 1: Botão "Editar" do nome
    console.log('1️⃣ Testando botão "Editar" do nome...');
    try {
      const editButton = await page.locator('button:has-text("Editar")').first();
      if (await editButton.isVisible()) {
        console.log('   ✓ Botão "Editar" encontrado');
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Verificar se apareceu campo de edição ou modal
        const editField = await page.$('input[type="text"]:focus, textarea:focus, [contenteditable="true"]:focus');
        const newModal = await page.$('[role="dialog"]:not(:has-text("Configurações"))');
        
        if (editField) {
          testResults.editName = '✅ FUNCIONAL - Campo de edição ativo';
          console.log('   ✅ Campo de edição apareceu');
        } else if (newModal) {
          testResults.editName = '✅ FUNCIONAL - Modal de edição abriu';
          console.log('   ✅ Modal de edição abriu');
        } else {
          testResults.editName = '⚠️ VISUAL - Clicável mas sem resultado visível';
          console.log('   ⚠️ Clicável mas sem resultado visível');
        }
      } else {
        testResults.editName = '❌ NÃO ENCONTRADO';
        console.log('   ❌ Botão "Editar" não encontrado');
      }
    } catch (error) {
      testResults.editName = `🚨 ERRO: ${error.message}`;
      console.log(`   🚨 Erro: ${error.message}`);
    }
    
    // Teste 2: Botão "Fazer Upgrade para Enterprise"
    console.log('\n2️⃣ Testando botão "Fazer Upgrade para Enterprise"...');
    try {
      const upgradeButton = await page.locator('button:has-text("Fazer Upgrade"), button:has-text("Upgrade")').first();
      if (await upgradeButton.isVisible()) {
        console.log('   ✓ Botão "Upgrade" encontrado');
        
        const initialUrl = page.url();
        await upgradeButton.click();
        await page.waitForTimeout(2000);
        
        const newUrl = page.url();
        const newTab = context.pages().length > 1;
        const newModal = await page.$('[role="dialog"]:not(:has-text("Configurações"))');
        
        if (newUrl !== initialUrl) {
          testResults.upgradeButton = '✅ FUNCIONAL - Redirecionou para nova página';
          console.log(`   ✅ Redirecionou para: ${newUrl}`);
        } else if (newTab) {
          testResults.upgradeButton = '✅ FUNCIONAL - Abriu nova aba';
          console.log('   ✅ Abriu nova aba');
        } else if (newModal) {
          testResults.upgradeButton = '✅ FUNCIONAL - Abriu modal de upgrade';
          console.log('   ✅ Modal de upgrade abriu');
        } else {
          testResults.upgradeButton = '⚠️ VISUAL - Clicável mas sem resultado visível';
          console.log('   ⚠️ Clicável mas sem resultado visível');
        }
      } else {
        testResults.upgradeButton = '❌ NÃO ENCONTRADO';
        console.log('   ❌ Botão "Upgrade" não encontrado');
      }
    } catch (error) {
      testResults.upgradeButton = `🚨 ERRO: ${error.message}`;
      console.log(`   🚨 Erro: ${error.message}`);
    }
    
    // Voltar ao modal se saiu
    if (page.url() !== 'http://localhost:3001' && !page.url().includes('localhost:3001')) {
      await page.goto('http://localhost:3001');
      await page.waitForTimeout(1000);
      if (settingsButton) {
        await settingsButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Teste 3: Seletor de Tema
    console.log('\n3️⃣ Testando seletor de tema...');
    try {
      const lightButton = await page.locator('button:has-text("Claro")').first();
      const darkButton = await page.locator('button:has-text("Escuro")').first();
      
      if (await lightButton.isVisible() && await darkButton.isVisible()) {
        console.log('   ✓ Botões de tema encontrados');
        
        // Verificar estado inicial
        const lightSelected = await lightButton.evaluate(el => el.classList.contains('selected') || el.getAttribute('aria-selected') === 'true');
        const darkSelected = await darkButton.evaluate(el => el.classList.contains('selected') || el.getAttribute('aria-selected') === 'true');
        
        console.log(`   Estado inicial: Claro=${lightSelected}, Escuro=${darkSelected}`);
        
        // Tentar mudar tema
        if (lightSelected) {
          await darkButton.click();
          console.log('   Clicando em tema Escuro...');
        } else {
          await lightButton.click();
          console.log('   Clicando em tema Claro...');
        }
        
        await page.waitForTimeout(1000);
        
        // Verificar mudança visual
        const bodyClass = await page.getAttribute('body', 'class') || '';
        const htmlDataTheme = await page.getAttribute('html', 'data-theme') || '';
        const rootStyle = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-color'));
        
        console.log(`   Classes/atributos após clique: body.class="${bodyClass}", html[data-theme]="${htmlDataTheme}"`);
        
        if (bodyClass.includes('dark') || htmlDataTheme.includes('dark') || rootStyle !== '') {
          testResults.themeSelector = '✅ FUNCIONAL - Tema mudou visualmente';
          console.log('   ✅ Mudança de tema detectada');
        } else {
          // Verificar mudança de estado do botão
          const newLightSelected = await lightButton.evaluate(el => el.classList.contains('selected') || el.getAttribute('aria-selected') === 'true');
          const newDarkSelected = await darkButton.evaluate(el => el.classList.contains('selected') || el.getAttribute('aria-selected') === 'true');
          
          if ((lightSelected !== newLightSelected) || (darkSelected !== newDarkSelected)) {
            testResults.themeSelector = '⚠️ PARCIAL - Estado dos botões mudou mas tema visual não';
            console.log('   ⚠️ Estado dos botões mudou mas tema visual não detectado');
          } else {
            testResults.themeSelector = '⚠️ VISUAL - Clicável mas sem mudança detectada';
            console.log('   ⚠️ Clicável mas sem mudança detectada');
          }
        }
      } else {
        testResults.themeSelector = '❌ NÃO ENCONTRADO';
        console.log('   ❌ Botões de tema não encontrados');
      }
    } catch (error) {
      testResults.themeSelector = `🚨 ERRO: ${error.message}`;
      console.log(`   🚨 Erro: ${error.message}`);
    }
    
    // Teste 4: Dropdown de Modelo de IA
    console.log('\n4️⃣ Testando dropdown de modelo de IA...');
    try {
      const modelSelect = await page.locator('select').first();
      if (await modelSelect.isVisible()) {
        console.log('   ✓ Dropdown de modelo encontrado');
        
        const initialValue = await modelSelect.inputValue();
        console.log(`   Valor inicial: ${initialValue}`);
        
        // Listar opções disponíveis
        const options = await modelSelect.locator('option').allTextContents();
        console.log(`   Opções disponíveis: ${options.join(', ')}`);
        
        // Tentar mudar para uma opção diferente
        if (options.length > 1) {
          const targetOption = options.find(opt => !opt.includes(initialValue)) || options[1];
          await modelSelect.selectOption({ label: targetOption });
          await page.waitForTimeout(500);
          
          const newValue = await modelSelect.inputValue();
          console.log(`   Novo valor: ${newValue}`);
          
          if (newValue !== initialValue) {
            testResults.modelSelect = '✅ FUNCIONAL - Valor mudou';
            console.log('   ✅ Modelo mudou com sucesso');
          } else {
            testResults.modelSelect = '⚠️ VISUAL - Clicável mas valor não mudou';
            console.log('   ⚠️ Clicável mas valor não mudou');
          }
        } else {
          testResults.modelSelect = '⚠️ LIMITADO - Apenas uma opção disponível';
          console.log('   ⚠️ Apenas uma opção disponível');
        }
      } else {
        testResults.modelSelect = '❌ NÃO ENCONTRADO';
        console.log('   ❌ Dropdown de modelo não encontrado');
      }
    } catch (error) {
      testResults.modelSelect = `🚨 ERRO: ${error.message}`;
      console.log(`   🚨 Erro: ${error.message}`);
    }
    
    // Teste 5: Botão "Gerenciar Cobrança"
    console.log('\n5️⃣ Testando botão "Gerenciar Cobrança"...');
    try {
      const billingButton = await page.locator('button:has-text("Gerenciar Cobrança"), button:has-text("Cobrança")').first();
      if (await billingButton.isVisible()) {
        console.log('   ✓ Botão "Gerenciar Cobrança" encontrado');
        
        const initialUrl = page.url();
        await billingButton.click();
        await page.waitForTimeout(2000);
        
        const newUrl = page.url();
        const newTab = context.pages().length > 1;
        
        if (newUrl.includes('stripe') || newUrl.includes('billing') || newUrl.includes('payment')) {
          testResults.billingButton = '✅ FUNCIONAL - Redirecionou para sistema de cobrança';
          console.log(`   ✅ Redirecionou para sistema de cobrança: ${newUrl}`);
        } else if (newUrl !== initialUrl) {
          testResults.billingButton = '✅ FUNCIONAL - Redirecionou para página';
          console.log(`   ✅ Redirecionou para: ${newUrl}`);
        } else if (newTab) {
          testResults.billingButton = '✅ FUNCIONAL - Abriu nova aba';
          console.log('   ✅ Abriu nova aba');
        } else {
          testResults.billingButton = '⚠️ VISUAL - Clicável mas sem redirecionamento';
          console.log('   ⚠️ Clicável mas sem redirecionamento');
        }
      } else {
        testResults.billingButton = '❌ NÃO ENCONTRADO';
        console.log('   ❌ Botão "Gerenciar Cobrança" não encontrado');
      }
    } catch (error) {
      testResults.billingButton = `🚨 ERRO: ${error.message}`;
      console.log(`   🚨 Erro: ${error.message}`);
    }
    
    // Teste 6: Toggles de Privacidade
    console.log('\n6️⃣ Testando toggles de privacidade...');
    try {
      const toggles = await page.locator('input[type="checkbox"]').all();
      if (toggles.length > 0) {
        console.log(`   ✓ ${toggles.length} toggles encontrados`);
        
        const firstToggle = toggles[0];
        const initialState = await firstToggle.isChecked();
        console.log(`   Estado inicial do primeiro toggle: ${initialState}`);
        
        await firstToggle.click();
        await page.waitForTimeout(500);
        
        const newState = await firstToggle.isChecked();
        console.log(`   Novo estado: ${newState}`);
        
        if (initialState !== newState) {
          testResults.privacyToggles = '✅ FUNCIONAL - Estado mudou';
          console.log('   ✅ Toggle mudou de estado');
        } else {
          testResults.privacyToggles = '⚠️ VISUAL - Clicável mas estado não mudou';
          console.log('   ⚠️ Clicável mas estado não mudou');
        }
      } else {
        testResults.privacyToggles = '❌ NÃO ENCONTRADO';
        console.log('   ❌ Toggles não encontrados');
      }
    } catch (error) {
      testResults.privacyToggles = `🚨 ERRO: ${error.message}`;
      console.log(`   🚨 Erro: ${error.message}`);
    }
    
    // Teste 7: Botão "Salvar alterações"
    console.log('\n7️⃣ Testando botão "Salvar alterações"...');
    try {
      const saveButton = await page.locator('button:has-text("Salvar"), button:has-text("Salvar alterações")').first();
      if (await saveButton.isVisible()) {
        console.log('   ✓ Botão "Salvar" encontrado');
        
        await saveButton.click();
        await page.waitForTimeout(1500);
        
        // Verificar se modal fechou
        const modalStillVisible = await page.isVisible('[role="dialog"], .modal, div:has-text("Configurações")');
        
        if (!modalStillVisible) {
          testResults.saveButton = '✅ FUNCIONAL - Modal fechou após salvar';
          console.log('   ✅ Modal fechou após salvar');
        } else {
          // Verificar feedback visual (toast, mensagem de sucesso, etc.)
          const successMessage = await page.$('.toast, .alert, div:has-text("salvo"), div:has-text("sucesso")');
          if (successMessage) {
            testResults.saveButton = '✅ FUNCIONAL - Mostrou feedback de salvamento';
            console.log('   ✅ Mostrou feedback de salvamento');
          } else {
            testResults.saveButton = '⚠️ VISUAL - Clicável mas sem feedback';
            console.log('   ⚠️ Clicável mas sem feedback visível');
          }
        }
      } else {
        testResults.saveButton = '❌ NÃO ENCONTRADO';
        console.log('   ❌ Botão "Salvar" não encontrado');
      }
    } catch (error) {
      testResults.saveButton = `🚨 ERRO: ${error.message}`;
      console.log(`   🚨 Erro: ${error.message}`);
    }
    
    // RESULTADOS FINAIS
    console.log('\n\n📊 RELATÓRIO FINAL DE FUNCIONALIDADES:');
    console.log('=====================================');
    
    const categories = {
      '✅ FUNCIONAIS': [],
      '⚠️ VISUAIS': [],
      '❌ NÃO ENCONTRADOS': [],
      '🚨 COM ERRO': []
    };
    
    for (const [feature, result] of Object.entries(testResults)) {
      if (result.includes('✅')) categories['✅ FUNCIONAIS'].push(feature + ': ' + result);
      else if (result.includes('⚠️')) categories['⚠️ VISUAIS'].push(feature + ': ' + result);
      else if (result.includes('❌')) categories['❌ NÃO ENCONTRADOS'].push(feature + ': ' + result);
      else if (result.includes('🚨')) categories['🚨 COM ERRO'].push(feature + ': ' + result);
    }
    
    for (const [category, items] of Object.entries(categories)) {
      if (items.length > 0) {
        console.log(`\n${category}:`);
        items.forEach(item => console.log(`  • ${item}`));
      }
    }
    
    const totalFeatures = Object.keys(testResults).length;
    const functionalFeatures = categories['✅ FUNCIONAIS'].length;
    const visualFeatures = categories['⚠️ VISUAIS'].length;
    
    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`Total de funcionalidades testadas: ${totalFeatures}`);
    console.log(`Completamente funcionais: ${functionalFeatures} (${Math.round((functionalFeatures/totalFeatures)*100)}%)`);
    console.log(`Apenas visuais: ${visualFeatures} (${Math.round((visualFeatures/totalFeatures)*100)}%)`);
    
    console.log('\n🎯 CONCLUSÃO:');
    if (functionalFeatures > totalFeatures * 0.7) {
      console.log('✅ EXCELENTE: Modal tem alta funcionalidade implementada');
    } else if (functionalFeatures > totalFeatures * 0.5) {
      console.log('👍 BOM: Modal tem funcionalidade razoável implementada');
    } else if (functionalFeatures > totalFeatures * 0.3) {
      console.log('⚠️ MÉDIO: Modal tem funcionalidade básica, muitos elementos são apenas visuais');
    } else {
      console.log('❌ BAIXO: Modal é principalmente visual, poucas funcionalidades implementadas');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
  
  console.log('\n🔚 Teste concluído! Mantenha a janela aberta para revisar os resultados.');
}

// Antes de executar, verificar se o Chrome está com debugging habilitado
console.log('Para usar este script, certifique-se de ter o Chrome aberto com:');
console.log('chrome --remote-debugging-port=9222');
console.log('\nSe não estiver, abra um novo Chrome assim e acesse localhost:3001 logado.');
console.log('\nIniciando teste em 3 segundos...');

setTimeout(() => {
  testSettingsModalLoggedIn().catch(error => {
    console.error('❌ Erro de conexão:', error);
    console.log('\n💡 SOLUÇÃO: Abra o Chrome com debugging:');
    console.log('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
  });
}, 3000);