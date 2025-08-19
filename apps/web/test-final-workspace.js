const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runFinalWorkspaceTest() {
  console.log('🚀 Starting final workspace page test...');
  
  const resultsDir = path.join(__dirname, 'test-results-final');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Step 1: Going directly to workspace URL...');
    
    // Go directly to workspace and capture what happens
    await page.goto('http://localhost:3001/workspace');
    await page.waitForTimeout(3000);
    
    console.log('Current URL after navigation:', page.url());
    
    // Capture screenshot of whatever page we end up on
    await page.screenshot({ 
      path: path.join(resultsDir, 'direct-workspace-navigation.png'),
      fullPage: true 
    });

    // Check if we ended up on workspace page or somewhere else
    const currentUrl = page.url();
    
    if (currentUrl.includes('/workspace')) {
      console.log('✅ Successfully on workspace page!');
      await analyzeWorkspacePage(page, resultsDir);
    } else {
      console.log(`⚠️ Redirected to: ${currentUrl}`);
      await analyzeRedirectPage(page, resultsDir);
    }

    // Let's also try to inspect the page source to see if there are any JavaScript redirects
    const pageContent = await page.content();
    
    // Check for any redirect mechanisms in the HTML
    if (pageContent.includes('router.push') || pageContent.includes('window.location')) {
      console.log('⚠️ Client-side redirect detected in page content');
    }
    
    // Look for workspace-related elements even if we're not on the right URL
    const workspaceElements = await page.locator('*[class*="workspace"], *[class*="admin"], h1, h2').count();
    console.log('Total heading/workspace elements found:', workspaceElements);
    
    // Try to find any text that indicates this is a workspace page
    const workspaceText = await page.locator('text=/workspace|admin|administra|dashboard/i').count();
    console.log('Workspace-related text found:', workspaceText);
    
    // Check for any tabs or navigation
    const tabElements = await page.locator('button, a, [role="tab"]').count();
    console.log('Interactive elements found:', tabElements);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: path.join(resultsDir, 'test-error.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

async function analyzeWorkspacePage(page, resultsDir) {
  console.log('🔍 Analyzing workspace page...');
  
  // Look for workspace-specific elements
  const elements = {
    sidebar: await page.locator('[class*="sidebar"], nav').count(),
    mainContent: await page.locator('main, [class*="main"]').count(),
    adminTitle: await page.locator('h1:has-text("Administração"), [class*="adminTitle"]').count(),
    tabs: await page.locator('[class*="adminTab"], button').count(),
    cards: await page.locator('[class*="Card"], [class*="card"]').count()
  };
  
  console.log('Workspace elements found:', elements);
  
  // Test different viewport sizes
  const viewports = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];
  
  for (const viewport of viewports) {
    console.log(`📱 Testing ${viewport.name} view (${viewport.width}x${viewport.height})`);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(resultsDir, `workspace-${viewport.name}.png`),
      fullPage: true
    });
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    success: true,
    elements,
    screenshots: viewports.map(v => `workspace-${v.name}.png`)
  };
  
  fs.writeFileSync(
    path.join(resultsDir, 'workspace-analysis.json'),
    JSON.stringify(report, null, 2)
  );
}

async function analyzeRedirectPage(page, resultsDir) {
  console.log('🔍 Analyzing redirect page...');
  
  const url = page.url();
  const title = await page.title();
  
  console.log('Redirected to URL:', url);
  console.log('Page title:', title);
  
  // Take screenshots at different sizes anyway to see the current page
  const viewports = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'mobile', width: 375, height: 667 }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(resultsDir, `redirect-page-${viewport.name}.png`),
      fullPage: true
    });
  }
  
  // Look for any authentication-related elements
  const authElements = {
    loginButtons: await page.locator('button:has-text("login"), a:has-text("login"), [class*="login"]').count(),
    emailInputs: await page.locator('input[type="email"]').count(),
    forms: await page.locator('form').count()
  };
  
  console.log('Auth elements found:', authElements);
  
  const report = {
    timestamp: new Date().toISOString(),
    success: false,
    redirectUrl: url,
    pageTitle: title,
    authElements,
    reason: 'Redirected away from workspace page'
  };
  
  fs.writeFileSync(
    path.join(resultsDir, 'redirect-analysis.json'),
    JSON.stringify(report, null, 2)
  );
}

// Run the test
runFinalWorkspaceTest().catch(console.error);