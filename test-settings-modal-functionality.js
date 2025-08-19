const { chromium } = require('playwright');

async function testSettingsModalFunctionality() {
  console.log('🔧 Iniciando teste completo do modal de configurações...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Navegar para o site
    console.log('📍 Navegando para localhost:3001...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // 2. Fazer login primeiro
    console.log('🔐 Iniciando processo de login...');
    await page.click('[data-testid="login-button"], button:has-text("Entrar"), button:has-text("Login")');
    await page.waitForTimeout(1000);
    
    // Preencher email
    await page.fill('input[type="email"], input[name="email"]', 'flowagencyai@gmail.com');
    await page.click('button[type="submit"], button:has-text("Continuar")');
    
    console.log('📧 Email enviado. Aguardando confirmação manual ou redirecionamento...');
    
    // Aguardar login ser completado (usuário precisa clicar no link do email ou já estar logado)
    await page.waitForTimeout(5000);
    
    // 3. Procurar botão de configurações
    console.log('⚙️ Procurando botão de configurações...');
    
    const settingsSelectors = [
      '[data-testid="settings-button"]',
      'button:has-text("Configurações")',
      'button:has-text("Settings")', 
      '[aria-label="Settings"]',
      'button[title="Configurações"]',
      '.settings-button',
      'button svg path[d*="M12"]', // Ícone de engrenagem comum
    ];
    
    let settingsButton = null;
    for (const selector of settingsSelectors) {
      settingsButton = await page.$(selector);
      if (settingsButton) {
        console.log(`✅ Botão de configurações encontrado: ${selector}`);
        break;
      }
    }
    
    if (!settingsButton) {
      console.log('❌ Botão de configurações não encontrado. Tentando outras estratégias...');
      
      // Tentar encontrar por posição ou contexto
      const allButtons = await page.$$('button');
      console.log(`🔍 Encontrados ${allButtons.length} botões na página`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const button = allButtons[i];
        const text = await button.textContent();
        const title = await button.getAttribute('title');
        const ariaLabel = await button.getAttribute('aria-label');
        
        console.log(`Botão ${i}: texto="${text}" title="${title}" aria-label="${ariaLabel}"`);
        
        if (text?.toLowerCase().includes('config') || 
            text?.toLowerCase().includes('setting') ||
            title?.toLowerCase().includes('config') ||
            ariaLabel?.toLowerCase().includes('setting')) {
          settingsButton = button;
          console.log(`✅ Botão de configurações encontrado por contexto!`);
          break;
        }
      }
    }
    
    if (!settingsButton) {
      console.log('❌ Não foi possível encontrar o botão de configurações. Verificando se o usuário está logado...');
      
      // Verificar elementos que indicam login
      const userIndicators = await page.$$('[data-testid="user-menu"], .user-avatar, .user-email');
      if (userIndicators.length === 0) {
        console.log('⚠️ Parece que o usuário não está logado. Finalizando teste.');
        return;
      }
    }
    
    // 4. Abrir modal de configurações
    console.log('🔓 Abrindo modal de configurações...');
    await settingsButton.click();
    await page.waitForTimeout(1000);
    
    // 5. Verificar se o modal abriu
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '[data-testid="settings-modal"]',
      'div:has-text("Configurações")',
    ];
    
    let modal = null;
    for (const selector of modalSelectors) {
      modal = await page.$(selector);
      if (modal) {
        console.log(`✅ Modal encontrado: ${selector}`);
        break;
      }
    }
    
    if (!modal) {
      console.log('❌ Modal de configurações não abriu. Tentando novamente...');
      await page.keyboard.press('Escape'); // Fechar qualquer modal aberto
      await page.waitForTimeout(500);
      await settingsButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 6. Testar funcionalidades específicas do modal
    console.log('\n🧪 TESTANDO FUNCIONALIDADES DO MODAL:');
    
    const testResults = {};
    
    // Teste 1: Botão "Editar" nome
    console.log('\n1️⃣ Testando botão "Editar" do nome...');
    try {
      const editButton = await page.$('button:has-text("Editar")');
      if (editButton) {
        testResults.editName = 'encontrado';
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Verificar se algo aconteceu (modal de edição, campo editável, etc.)
        const editField = await page.$('input[type="text"]:focus, textarea:focus');
        if (editField) {
          testResults.editName = 'funcional - campo editável apareceu';
        } else {
          testResults.editName = 'clicável mas sem funcionalidade visível';
        }
      } else {
        testResults.editName = 'não encontrado';
      }
    } catch (error) {
      testResults.editName = `erro: ${error.message}`;
    }
    
    // Teste 2: Botão "Fazer Upgrade para Enterprise"
    console.log('\n2️⃣ Testando botão "Fazer Upgrade para Enterprise"...');
    try {
      const upgradeButton = await page.$('button:has-text("Fazer Upgrade"), button:has-text("Upgrade")');
      if (upgradeButton) {
        testResults.upgradeButton = 'encontrado';
        await upgradeButton.click();
        await page.waitForTimeout(1000);
        
        // Verificar se redirecionou ou abriu novo modal/página
        const currentUrl = page.url();
        const newModal = await page.$('[role="dialog"]:not([data-testid="settings-modal"])');
        
        if (currentUrl.includes('upgrade') || currentUrl.includes('billing') || newModal) {
          testResults.upgradeButton = 'funcional - redirecionou ou abriu modal';
        } else {
          testResults.upgradeButton = 'clicável mas sem funcionalidade visível';
        }
      } else {
        testResults.upgradeButton = 'não encontrado';
      }
    } catch (error) {
      testResults.upgradeButton = `erro: ${error.message}`;
    }
    
    // Teste 3: Botão "Gerenciar Cobrança"
    console.log('\n3️⃣ Testando botão "Gerenciar Cobrança"...');
    try {
      const billingButton = await page.$('button:has-text("Gerenciar Cobrança"), button:has-text("Gerenciar")');
      if (billingButton) {
        testResults.billingButton = 'encontrado';
        await billingButton.click();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('billing') || currentUrl.includes('stripe') || currentUrl.includes('payment')) {
          testResults.billingButton = 'funcional - redirecionou para billing';
        } else {
          testResults.billingButton = 'clicável mas sem funcionalidade visível';
        }
      } else {
        testResults.billingButton = 'não encontrado';
      }
    } catch (error) {
      testResults.billingButton = `erro: ${error.message}`;
    }
    
    // Teste 4: Seletor de Tema
    console.log('\n4️⃣ Testando seletor de tema...');
    try {
      const themeButtons = await page.$$('button:has-text("Claro"), button:has-text("Escuro")');
      if (themeButtons.length >= 2) {
        testResults.themeSelector = 'encontrado';
        
        // Testar mudança de tema
        const darkButton = themeButtons.find(async btn => {
          const text = await btn.textContent();
          return text?.includes('Escuro');
        });
        
        if (darkButton) {
          await darkButton.click();
          await page.waitForTimeout(500);
          
          // Verificar se houve mudança visual
          const bodyClass = await page.getAttribute('body', 'class');
          const htmlDataTheme = await page.getAttribute('html', 'data-theme');
          
          if (bodyClass?.includes('dark') || htmlDataTheme === 'dark') {
            testResults.themeSelector = 'funcional - tema mudou';
          } else {
            testResults.themeSelector = 'clicável mas mudança não detectada';
          }
        }
      } else {
        testResults.themeSelector = 'não encontrado';
      }
    } catch (error) {
      testResults.themeSelector = `erro: ${error.message}`;
    }
    
    // Teste 5: Dropdown de Modelo de IA
    console.log('\n5️⃣ Testando dropdown de modelo de IA...');
    try {
      const modelSelect = await page.$('select');
      if (modelSelect) {
        testResults.modelSelect = 'encontrado';
        
        // Testar mudança de modelo
        await modelSelect.selectOption('gpt-4o');
        await page.waitForTimeout(500);
        
        const selectedValue = await modelSelect.inputValue();
        if (selectedValue === 'gpt-4o') {
          testResults.modelSelect = 'funcional - valor mudou';
        } else {
          testResults.modelSelect = 'clicável mas valor não mudou';
        }
      } else {
        testResults.modelSelect = 'não encontrado';
      }
    } catch (error) {
      testResults.modelSelect = `erro: ${error.message}`;
    }
    
    // Teste 6: Botão "Configurações de Segurança"
    console.log('\n6️⃣ Testando botão "Configurações de Segurança"...');
    try {
      const securityButton = await page.$('button:has-text("Configurações de Segurança"), button:has-text("Segurança")');
      if (securityButton) {
        testResults.securityButton = 'encontrado';
        await securityButton.click();
        await page.waitForTimeout(1000);
        
        const newModal = await page.$('[role="dialog"]:not([data-testid="settings-modal"])');
        const currentUrl = page.url();
        
        if (newModal || currentUrl.includes('security')) {
          testResults.securityButton = 'funcional - abriu modal/página';
        } else {
          testResults.securityButton = 'clicável mas sem funcionalidade visível';
        }
      } else {
        testResults.securityButton = 'não encontrado';
      }
    } catch (error) {
      testResults.securityButton = `erro: ${error.message}`;
    }
    
    // Teste 7: Botão "Gerenciar API Keys"
    console.log('\n7️⃣ Testando botão "Gerenciar API Keys"...');
    try {
      const apiButton = await page.$('button:has-text("Gerenciar API Keys"), button:has-text("API Keys")');
      if (apiButton) {
        testResults.apiButton = 'encontrado';
        await apiButton.click();
        await page.waitForTimeout(1000);
        
        const newModal = await page.$('[role="dialog"]:not([data-testid="settings-modal"])');
        if (newModal) {
          testResults.apiButton = 'funcional - abriu modal';
        } else {
          testResults.apiButton = 'clicável mas sem funcionalidade visível';
        }
      } else {
        testResults.apiButton = 'não encontrado';
      }
    } catch (error) {
      testResults.apiButton = `erro: ${error.message}`;
    }
    
    // Teste 8: Botão "Exportar Dados"
    console.log('\n8️⃣ Testando botão "Exportar Dados"...');
    try {
      const exportButton = await page.$('button:has-text("Exportar Dados"), button:has-text("Exportar")');
      if (exportButton) {
        testResults.exportButton = 'encontrado';
        
        // Configurar listener para download
        let downloadStarted = false;
        page.on('download', () => {
          downloadStarted = true;
        });
        
        await exportButton.click();
        await page.waitForTimeout(2000);
        
        if (downloadStarted) {
          testResults.exportButton = 'funcional - iniciou download';
        } else {
          testResults.exportButton = 'clicável mas download não iniciado';
        }
      } else {
        testResults.exportButton = 'não encontrado';
      }
    } catch (error) {
      testResults.exportButton = `erro: ${error.message}`;
    }
    
    // Teste 9: Botão "Limpar todas as conversas"
    console.log('\n9️⃣ Testando botão "Limpar todas as conversas"...');
    try {
      const clearButton = await page.$('button:has-text("Limpar todas as conversas"), button:has-text("Limpar")');
      if (clearButton) {
        testResults.clearButton = 'encontrado';
        
        // Interceptar alert/confirm
        let alertShown = false;
        page.on('dialog', async dialog => {
          alertShown = true;
          await dialog.dismiss(); // Cancelar para não limpar dados de verdade
        });
        
        await clearButton.click();
        await page.waitForTimeout(500);
        
        if (alertShown) {
          testResults.clearButton = 'funcional - mostrou confirmação';
        } else {
          testResults.clearButton = 'clicável mas sem confirmação';
        }
      } else {
        testResults.clearButton = 'não encontrado';
      }
    } catch (error) {
      testResults.clearButton = `erro: ${error.message}`;
    }
    
    // Teste 10: Toggles de Privacidade
    console.log('\n🔟 Testando toggles de privacidade...');
    try {
      const toggles = await page.$$('input[type="checkbox"]');
      if (toggles.length > 0) {
        testResults.privacyToggles = `encontrados ${toggles.length} toggles`;
        
        // Testar primeiro toggle
        const firstToggle = toggles[0];
        const initialState = await firstToggle.isChecked();
        await firstToggle.click();
        await page.waitForTimeout(500);
        const newState = await firstToggle.isChecked();
        
        if (initialState !== newState) {
          testResults.privacyToggles = 'funcional - estado mudou';
        } else {
          testResults.privacyToggles = 'clicável mas estado não mudou';
        }
      } else {
        testResults.privacyToggles = 'não encontrado';
      }
    } catch (error) {
      testResults.privacyToggles = `erro: ${error.message}`;
    }
    
    // Teste 11: Botão "Deletar Conta Permanentemente"
    console.log('\n1️⃣1️⃣ Testando botão "Deletar Conta Permanentemente"...');
    try {
      const deleteButton = await page.$('button:has-text("Deletar Conta Permanentemente"), button:has-text("Deletar Conta")');
      if (deleteButton) {
        testResults.deleteButton = 'encontrado';
        
        // Interceptar alert/confirm
        let alertShown = false;
        page.on('dialog', async dialog => {
          alertShown = true;
          await dialog.dismiss(); // Cancelar para não deletar conta de verdade
        });
        
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        if (alertShown) {
          testResults.deleteButton = 'funcional - mostrou confirmação';
        } else {
          testResults.deleteButton = 'clicável mas sem confirmação';
        }
      } else {
        testResults.deleteButton = 'não encontrado';
      }
    } catch (error) {
      testResults.deleteButton = `erro: ${error.message}`;
    }
    
    // Teste 12: Botões "Cancelar" e "Salvar alterações"
    console.log('\n1️⃣2️⃣ Testando botões de rodapé...');
    try {
      const cancelButton = await page.$('button:has-text("Cancelar")');
      const saveButton = await page.$('button:has-text("Salvar alterações"), button:has-text("Salvar")');
      
      if (cancelButton && saveButton) {
        testResults.footerButtons = 'encontrados';
        
        // Testar botão Salvar (não deve fechar modal imediatamente)
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        const modalStillOpen = await page.$('[role="dialog"]');
        if (!modalStillOpen) {
          testResults.footerButtons = 'funcional - botão Salvar fechou modal';
        } else {
          testResults.footerButtons = 'clicável mas modal ainda aberto';
        }
      } else {
        testResults.footerButtons = 'não encontrados';
      }
    } catch (error) {
      testResults.footerButtons = `erro: ${error.message}`;
    }
    
    // 7. Exibir resultados
    console.log('\n📊 RESULTADOS DO TESTE:');
    console.log('=======================');
    
    for (const [feature, result] of Object.entries(testResults)) {
      const status = result.includes('funcional') ? '✅' : 
                     result.includes('encontrado') ? '⚠️' : 
                     result.includes('não encontrado') ? '❌' : '🚨';
      
      console.log(`${status} ${feature}: ${result}`);
    }
    
    // Análise geral
    const functionalCount = Object.values(testResults).filter(r => r.includes('funcional')).length;
    const foundCount = Object.values(testResults).filter(r => r.includes('encontrado')).length;
    const totalCount = Object.keys(testResults).length;
    
    console.log('\n📈 RESUMO:');
    console.log(`Funcionalidades completamente funcionais: ${functionalCount}/${totalCount}`);
    console.log(`Elementos encontrados mas não funcionais: ${foundCount}/${totalCount}`);
    console.log(`Taxa de funcionalidade: ${Math.round((functionalCount/totalCount)*100)}%`);
    
    if (functionalCount < totalCount * 0.5) {
      console.log('\n⚠️ CONCLUSÃO: Modal possui principalmente elementos visuais não funcionais');
    } else {
      console.log('\n✅ CONCLUSÃO: Modal possui boa funcionalidade implementada');
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  } finally {
    console.log('\n🔚 Encerrando teste em 5 segundos...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testSettingsModalFunctionality().catch(console.error);