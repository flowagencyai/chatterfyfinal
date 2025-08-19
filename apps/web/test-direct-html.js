const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDirectHTML() {
  console.log('🚀 Starting direct HTML test...');
  
  const resultsDir = path.join(__dirname, 'test-direct-html');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Testing direct URL navigation...');
    
    // Go to test-workspace and wait longer
    await page.goto('http://localhost:3001/test-workspace', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait extra time for any client-side rendering
    await page.waitForTimeout(5000);
    
    console.log('Current URL after navigation:', page.url());
    
    // Get the page HTML content
    const htmlContent = await page.content();
    console.log('Page title:', await page.title());
    
    // Save the HTML content for debugging
    fs.writeFileSync(path.join(resultsDir, 'page-content.html'), htmlContent);
    
    // Capture screenshots
    await page.screenshot({ 
      path: path.join(resultsDir, 'page-full.png'),
      fullPage: true 
    });
    
    await page.screenshot({ 
      path: path.join(resultsDir, 'page-viewport.png')
    });

    // Check what elements are actually present
    console.log('🔍 Analyzing actual page elements...');
    
    const allElements = await page.locator('*').count();
    console.log('Total elements on page:', allElements);
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    console.log('Headings found:', headings);
    
    const buttons = await page.locator('button').count();
    console.log('Buttons found:', buttons);
    
    const divs = await page.locator('div').count();
    console.log('Divs found:', divs);
    
    // Look for specific workspace elements
    const adminTitle = await page.locator('h1:has-text("Administração")').count();
    console.log('Admin title found:', adminTitle);
    
    const adminTabs = await page.locator('button:has-text("Visão Geral"), button:has-text("Membros")').count();
    console.log('Admin tabs found:', adminTabs);
    
    const sidebar = await page.locator('[class*="Sidebar"], nav').count();
    console.log('Sidebar elements found:', sidebar);
    
    const mainContent = await page.locator('main').count();
    console.log('Main content elements found:', mainContent);
    
    // Get text content of key elements
    const bodyText = await page.locator('body').textContent();
    console.log('Body contains "Administração":', bodyText?.includes('Administração'));
    console.log('Body contains "workspace":', bodyText?.includes('workspace'));
    console.log('Body contains "Como posso":', bodyText?.includes('Como posso'));
    
    // If we're still on the homepage, let's try a different approach
    if (bodyText?.includes('Como posso ajudar')) {
      console.log('⚠️ Still on homepage. Trying direct navigation approach...');
      
      // Try navigating by setting the URL in the address bar
      await page.evaluate(() => {
        window.location.href = '/test-workspace';
      });
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log('After direct navigation, URL:', page.url());
      
      await page.screenshot({ 
        path: path.join(resultsDir, 'after-direct-navigation.png'),
        fullPage: true 
      });
    }
    
    // Try to manually create the workspace content if it's not loading
    if (!bodyText?.includes('Administração')) {
      console.log('🔧 Workspace content not found. Checking if elements can be created manually...');
      
      // Check if we can at least inject some test content
      await page.evaluate(() => {
        const testDiv = document.createElement('div');
        testDiv.innerHTML = '<h1>TEST: This would be the workspace page</h1>';
        testDiv.style.position = 'fixed';
        testDiv.style.top = '100px';
        testDiv.style.left = '300px';
        testDiv.style.zIndex = '9999';
        testDiv.style.background = 'yellow';
        testDiv.style.padding = '20px';
        document.body.appendChild(testDiv);
      });
      
      await page.screenshot({ 
        path: path.join(resultsDir, 'with-injected-content.png')
      });
    }

    // Final analysis
    const report = {
      timestamp: new Date().toISOString(),
      finalUrl: page.url(),
      pageTitle: await page.title(),
      workspaceContentLoaded: bodyText?.includes('Administração') || false,
      redirectedToHomepage: bodyText?.includes('Como posso ajudar') || false,
      elementCounts: {
        total: allElements,
        headings: headings,
        buttons: buttons,
        divs: divs,
        adminTitle: adminTitle,
        adminTabs: adminTabs,
        sidebar: sidebar,
        mainContent: mainContent
      },
      recommendations: []
    };
    
    if (report.redirectedToHomepage) {
      report.recommendations.push('Page is redirecting to homepage - authentication or routing issue');
    }
    
    if (!report.workspaceContentLoaded) {
      report.recommendations.push('Workspace content is not loading - check component rendering');
    }
    
    fs.writeFileSync(
      path.join(resultsDir, 'direct-test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Direct HTML test completed');
    console.log('Report saved to:', path.join(resultsDir, 'direct-test-report.json'));

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: path.join(resultsDir, 'error.png')
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testDirectHTML().catch(console.error);