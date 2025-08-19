const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runAuthenticatedWorkspaceTest() {
  console.log('🚀 Starting authenticated workspace page test...');
  
  // Create results directory
  const resultsDir = path.join(__dirname, 'test-results-auth');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    viewport: { width: 1280, height: 720 }
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Step 1: Going to homepage to check auth status...');
    await page.goto('http://localhost:3001/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('📸 Step 2: Capturing homepage...');
    await page.screenshot({ 
      path: path.join(resultsDir, 'homepage.png'),
      fullPage: true 
    });

    // Check if we need to authenticate
    const loginButton = await page.locator('text="Fazer login"').count();
    const isLoggedOut = loginButton > 0;

    if (isLoggedOut) {
      console.log('🔐 User not authenticated, attempting login...');
      
      // Try clicking the login button
      await page.locator('text="Fazer login"').click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check if we're on auth page
      const currentUrl = page.url();
      console.log('Current URL after login click:', currentUrl);
      
      if (currentUrl.includes('/auth')) {
        console.log('📧 On auth page, attempting email authentication...');
        
        // Try to fill email and submit (if form exists)
        const emailInput = await page.locator('input[type="email"]').count();
        if (emailInput > 0) {
          await page.fill('input[type="email"]', 'test@example.com');
          
          const submitButton = await page.locator('button[type="submit"], button:has-text("Enviar"), button:has-text("Submit")').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(2000);
          }
        }
        
        // For testing purposes, let's try to mock the session by going directly
        // and see what happens
        console.log('⚠️ Auth flow started but for testing, let\'s try accessing workspace directly...');
      }
    }

    console.log('📍 Step 3: Attempting to navigate directly to workspace...');
    await page.goto('http://localhost:3001/workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);

    console.log('📸 Step 4: Capturing current page state...');
    await page.screenshot({ 
      path: path.join(resultsDir, 'workspace-attempt.png'),
      fullPage: true 
    });

    // Check if we're on the workspace page or redirected
    if (finalUrl.includes('/workspace')) {
      console.log('✅ Successfully on workspace page!');
      
      // Now run the comprehensive workspace tests
      await runWorkspacePageTests(page, resultsDir);
      
    } else if (finalUrl.includes('/auth')) {
      console.log('🔄 Redirected to auth page - user authentication required');
      
      // Let's try to simulate authentication state for testing
      console.log('🧪 Attempting to simulate authenticated session...');
      
      // Set some cookies to simulate session
      await context.addCookies([
        {
          name: 'next-auth.session-token',
          value: 'test-session-token',
          domain: 'localhost',
          path: '/'
        }
      ]);
      
      // Try again
      await page.goto('http://localhost:3001/workspace');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      if (page.url().includes('/workspace')) {
        console.log('✅ Session simulation worked!');
        await runWorkspacePageTests(page, resultsDir);
      } else {
        console.log('❌ Could not access workspace page - authentication required');
        await page.screenshot({ 
          path: path.join(resultsDir, 'auth-required.png'),
          fullPage: true 
        });
      }
      
    } else {
      console.log('🤔 Unexpected redirect to:', finalUrl);
    }

    // Test the current page regardless of which page we ended up on
    await analyzeCurrentPage(page, resultsDir);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: path.join(resultsDir, 'error.png')
    });
  } finally {
    await browser.close();
  }
}

async function runWorkspacePageTests(page, resultsDir) {
  console.log('🔍 Running workspace page analysis...');
  
  // Check layout components
  const sidebar = await page.locator('.workspace-sidebar, [class*="sidebar"], nav').first();
  const sidebarExists = await sidebar.count() > 0;
  
  let sidebarInfo = { exists: false };
  if (sidebarExists) {
    const sidebarBox = await sidebar.boundingBox();
    sidebarInfo = {
      exists: true,
      position: sidebarBox,
      width: sidebarBox?.width || 0,
      left: sidebarBox?.x || 0
    };
  }

  // Check for tabs
  const tabs = await page.locator('[role="tab"], .adminTab, button:has-text("Visão Geral"), button:has-text("Membros"), button:has-text("Cobrança"), button:has-text("Configurações")');
  const tabCount = await tabs.count();
  const tabTexts = [];
  
  for (let i = 0; i < tabCount; i++) {
    const tab = tabs.nth(i);
    const text = await tab.textContent();
    tabTexts.push(text?.trim() || '');
  }

  console.log('📊 Workspace Analysis:');
  console.log('  Sidebar:', sidebarInfo);
  console.log('  Tabs found:', tabCount);
  console.log('  Tab texts:', tabTexts);

  // Test tab navigation if tabs exist
  if (tabCount > 0) {
    console.log('🔄 Testing tab navigation...');
    
    const expectedTabs = ['Visão Geral', 'Membros', 'Cobrança', 'Configurações'];
    
    for (const tabName of expectedTabs) {
      console.log(`  Testing tab: ${tabName}`);
      
      const tabElement = page.locator(`button:has-text("${tabName}")`).first();
      const tabExists = await tabElement.count() > 0;
      
      if (tabExists) {
        await tabElement.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: path.join(resultsDir, `workspace-tab-${tabName.toLowerCase().replace(' ', '-')}.png`)
        });
        console.log(`    ✅ ${tabName} tab captured`);
      } else {
        console.log(`    ❌ ${tabName} tab not found`);
      }
    }
  }

  // Test responsiveness
  console.log('📱 Testing mobile responsiveness...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: path.join(resultsDir, 'workspace-mobile.png'),
    fullPage: true
  });

  // Back to desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(1000);
}

async function analyzeCurrentPage(page, resultsDir) {
  console.log('🔍 Analyzing current page...');
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get current URL
  const url = page.url();
  console.log('Current URL:', url);
  
  // Check for main content areas
  const mainContent = await page.locator('main, [class*="main"], [class*="content"]').count();
  console.log('Main content areas found:', mainContent);
  
  // Check for navigation elements
  const navElements = await page.locator('nav, [class*="nav"], [class*="sidebar"]').count();
  console.log('Navigation elements found:', navElements);
  
  // Check for forms
  const forms = await page.locator('form, input, button').count();
  console.log('Interactive elements found:', forms);
  
  // Final full page screenshot
  await page.screenshot({ 
    path: path.join(resultsDir, 'final-page-analysis.png'),
    fullPage: true 
  });
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    pageTitle: title,
    currentUrl: url,
    analysis: {
      mainContentAreas: mainContent,
      navigationElements: navElements,
      interactiveElements: forms
    },
    success: url.includes('/workspace'),
    recommendations: []
  };
  
  if (!url.includes('/workspace')) {
    report.recommendations.push('Could not access workspace page - authentication may be required');
  }
  
  if (mainContent === 0) {
    report.recommendations.push('No main content areas detected');
  }
  
  fs.writeFileSync(
    path.join(resultsDir, 'page-analysis-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('📋 Analysis complete. Report saved to:', path.join(resultsDir, 'page-analysis-report.json'));
}

// Run the test
runAuthenticatedWorkspaceTest().catch(console.error);