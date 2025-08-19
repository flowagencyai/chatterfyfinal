const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runWorkspaceTests() {
  console.log('🚀 Starting comprehensive workspace page test...');
  
  // Create results directory
  const resultsDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000, // Add delay to see what's happening
    viewport: { width: 1280, height: 720 }
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Step 1: Navigating to workspace page...');
    await page.goto('http://localhost:3001/workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any animations

    console.log('📸 Step 2: Capturing full page screenshot...');
    await page.screenshot({ 
      path: path.join(resultsDir, 'workspace-full-page.png'), 
      fullPage: true 
    });

    console.log('🔍 Step 3: Analyzing layout structure...');
    
    // Check sidebar positioning and dimensions
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

    // Check main content positioning
    const mainContent = await page.locator('main, .main-content, [class*="content"]').first();
    const mainContentExists = await mainContent.count() > 0;
    
    let mainContentInfo = { exists: false };
    if (mainContentExists) {
      const mainBox = await mainContent.boundingBox();
      mainContentInfo = {
        exists: true,
        position: mainBox,
        left: mainBox?.x || 0,
        width: mainBox?.width || 0
      };
    }

    // Check for navigation tabs
    const tabs = await page.locator('[role="tab"], .tab, [class*="tab"]').count();
    const tabElements = await page.locator('[role="tab"], .tab, [class*="tab"]').all();
    const tabTexts = [];
    for (const tab of tabElements) {
      const text = await tab.textContent();
      tabTexts.push(text?.trim() || '');
    }

    // Check for statistics cards (grid of 3 columns)
    const statsCards = await page.locator('.stats-card, .card, [class*="card"]').count();
    
    // Check for usage cards (grid of 2 columns)
    const usageCards = await page.locator('.usage-card, .usage, [class*="usage"]').count();

    console.log('📊 Layout Analysis Results:');
    console.log('  Sidebar:', sidebarInfo);
    console.log('  Main Content:', mainContentInfo);
    console.log('  Tabs found:', tabs);
    console.log('  Tab texts:', tabTexts);
    console.log('  Stats cards:', statsCards);
    console.log('  Usage cards:', usageCards);

    console.log('📸 Step 4: Capturing viewport screenshot...');
    await page.screenshot({ 
      path: path.join(resultsDir, 'workspace-viewport.png')
    });

    console.log('🔄 Step 5: Testing tab navigation...');
    
    // Define expected tabs
    const expectedTabs = ['Overview', 'Membros', 'Cobrança', 'Configurações'];
    
    for (let i = 0; i < expectedTabs.length; i++) {
      const tabName = expectedTabs[i];
      console.log(`  Testing tab: ${tabName}`);
      
      // Try to find and click the tab
      const tabSelector = `text="${tabName}"`;
      const tabElement = page.locator(tabSelector).first();
      const tabExists = await tabElement.count() > 0;
      
      if (tabExists) {
        await tabElement.click();
        await page.waitForTimeout(1000); // Wait for transition
        
        await page.screenshot({ 
          path: path.join(resultsDir, `workspace-tab-${tabName.toLowerCase()}.png`)
        });
        console.log(`    ✅ ${tabName} tab captured`);
      } else {
        console.log(`    ❌ ${tabName} tab not found`);
        
        // Try alternative selectors
        const alternativeSelectors = [
          `[class*="tab"]:has-text("${tabName}")`,
          `button:has-text("${tabName}")`,
          `a:has-text("${tabName}")`,
          `div:has-text("${tabName}")`
        ];
        
        for (const altSelector of alternativeSelectors) {
          const altElement = page.locator(altSelector).first();
          if (await altElement.count() > 0) {
            await altElement.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ 
              path: path.join(resultsDir, `workspace-tab-${tabName.toLowerCase()}-alt.png`)
            });
            console.log(`    ✅ ${tabName} tab found with alternative selector`);
            break;
          }
        }
      }
    }

    console.log('📱 Step 6: Testing mobile responsiveness...');
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(resultsDir, 'workspace-mobile.png'),
      fullPage: true
    });

    // Test mobile navigation if present
    const mobileMenu = await page.locator('.mobile-menu, .hamburger, [class*="mobile"]').first();
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: path.join(resultsDir, 'workspace-mobile-menu.png')
      });
    }

    console.log('🔍 Step 7: Checking for JavaScript errors...');
    
    // Check console for errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`Console Error: ${msg.text()}`);
      }
    });

    // Force a page interaction to trigger any lazy-loaded errors
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Test completed successfully!');
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3001/workspace',
      layout: {
        sidebar: sidebarInfo,
        mainContent: mainContentInfo,
        tabsFound: tabs,
        tabTexts: tabTexts,
        statsCards: statsCards,
        usageCards: usageCards
      },
      screenshots: [
        'workspace-full-page.png',
        'workspace-viewport.png',
        'workspace-mobile.png',
        ...expectedTabs.map(tab => `workspace-tab-${tab.toLowerCase()}.png`)
      ],
      errors: logs,
      recommendations: []
    };

    // Add recommendations based on findings
    if (sidebarInfo.width !== 260) {
      report.recommendations.push(`Sidebar width is ${sidebarInfo.width}px, expected 260px`);
    }
    
    if (mainContentInfo.left <= sidebarInfo.width) {
      report.recommendations.push('Main content may be overlapping with sidebar');
    }

    if (tabs === 0) {
      report.recommendations.push('No navigation tabs found');
    }

    if (statsCards < 3) {
      report.recommendations.push('Expected 3 statistics cards in grid layout');
    }

    if (usageCards < 2) {
      report.recommendations.push('Expected 2 usage cards in grid layout');
    }

    // Save report
    fs.writeFileSync(
      path.join(resultsDir, 'workspace-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('📋 Test Report Summary:');
    console.log('  Screenshots saved:', report.screenshots.length);
    console.log('  Errors found:', report.errors.length);
    console.log('  Recommendations:', report.recommendations.length);
    
    if (report.recommendations.length > 0) {
      console.log('\n⚠️  Recommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    console.log('\n📁 All results saved to:', resultsDir);

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: path.join(resultsDir, 'workspace-error.png')
    });
  } finally {
    await browser.close();
  }
}

// Run the test
runWorkspaceTests().catch(console.error);