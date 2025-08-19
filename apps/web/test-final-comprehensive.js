const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runComprehensiveWorkspaceTest() {
  console.log('🚀 Starting comprehensive workspace test...');
  
  const resultsDir = path.join(__dirname, 'test-results-comprehensive');
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
    console.log('📍 Step 1: Navigating to test workspace...');
    await page.goto('http://localhost:3001/test-workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully loaded test workspace!');
    console.log('Current URL:', page.url());

    // Capture full page screenshot
    await page.screenshot({ 
      path: path.join(resultsDir, '01-full-page-initial.png'),
      fullPage: true 
    });

    console.log('📐 Step 2: Analyzing layout structure...');
    
    // Detailed layout analysis
    const layoutAnalysis = await analyzeLayout(page);
    console.log('Layout Analysis:', layoutAnalysis);

    console.log('🔄 Step 3: Testing tab navigation...');
    await testTabNavigation(page, resultsDir);

    console.log('📱 Step 4: Testing responsive design...');
    await testResponsiveDesign(page, resultsDir);

    console.log('⚡ Step 5: Testing interactions and animations...');
    await testInteractions(page, resultsDir);

    console.log('🎯 Step 6: Generating comprehensive report...');
    const report = await generateReport(page, layoutAnalysis, resultsDir);
    
    console.log('✅ Test completed successfully!');
    console.log('📋 Report Summary:');
    console.log(`  - Layout Status: ${report.layout.status}`);
    console.log(`  - Sidebar: ${report.layout.sidebar.width}px wide, positioned at x=${report.layout.sidebar.left}`);
    console.log(`  - Main Content: starts at x=${report.layout.mainContent.left}, width=${report.layout.mainContent.width}px`);
    console.log(`  - Navigation Tabs: ${report.functionality.tabs.count} found`);
    console.log(`  - Statistics Cards: ${report.functionality.statsCards.count} found`);
    console.log(`  - Usage Cards: ${report.functionality.usageCards.count} found`);
    
    if (report.recommendations.length > 0) {
      console.log('⚠️ Recommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: path.join(resultsDir, 'error-final.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

async function analyzeLayout(page) {
  console.log('  📊 Analyzing layout components...');
  
  // Sidebar analysis
  const sidebar = await page.locator('[class*="Sidebar"], nav').first();
  const sidebarExists = await sidebar.count() > 0;
  let sidebarInfo = { exists: false, width: 0, left: 0 };
  
  if (sidebarExists) {
    const sidebarBox = await sidebar.boundingBox();
    sidebarInfo = {
      exists: true,
      width: sidebarBox?.width || 0,
      left: sidebarBox?.x || 0,
      height: sidebarBox?.height || 0
    };
  }

  // Main content analysis
  const mainContent = await page.locator('main, [class*="mainContent"]').first();
  const mainContentExists = await mainContent.count() > 0;
  let mainContentInfo = { exists: false, left: 0, width: 0 };
  
  if (mainContentExists) {
    const mainBox = await mainContent.boundingBox();
    mainContentInfo = {
      exists: true,
      left: mainBox?.x || 0,
      width: mainBox?.width || 0,
      height: mainBox?.height || 0
    };
  }

  // Content elements analysis
  const elements = {
    adminTitle: await page.locator('h1:has-text("Administração")').count(),
    adminTabs: await page.locator('[class*="adminTab"]').count(),
    statsCards: await page.locator('[class*="statCard"]').count(),
    usageCards: await page.locator('[class*="usageCard"]').count()
  };

  return {
    sidebar: sidebarInfo,
    mainContent: mainContentInfo,
    elements,
    layoutValid: sidebarInfo.width === 260 && mainContentInfo.left >= 260,
    contentOverlap: mainContentInfo.left <= sidebarInfo.width
  };
}

async function testTabNavigation(page, resultsDir) {
  console.log('  🔄 Testing tab functionality...');
  
  const tabs = [
    { name: 'Visão Geral', selector: 'button:has-text("Visão Geral")' },
    { name: 'Membros', selector: 'button:has-text("Membros")' },
    { name: 'Cobrança', selector: 'button:has-text("Cobrança")' },
    { name: 'Configurações', selector: 'button:has-text("Configurações")' }
  ];

  let tabTestResults = [];

  for (const tab of tabs) {
    console.log(`    Testing ${tab.name} tab...`);
    
    const tabElement = page.locator(tab.selector).first();
    const tabExists = await tabElement.count() > 0;
    
    if (tabExists) {
      // Check initial state
      const isActive = await tabElement.getAttribute('class');
      
      // Click the tab
      await tabElement.click();
      await page.waitForTimeout(1000);
      
      // Check if tab became active
      const newClass = await tabElement.getAttribute('class');
      const becameActive = newClass?.includes('adminTabActive');
      
      // Take screenshot
      const filename = `02-tab-${tab.name.toLowerCase().replace(' ', '-')}.png`;
      await page.screenshot({ 
        path: path.join(resultsDir, filename),
        fullPage: true
      });

      // Check if content changed
      const tabContent = await page.locator('[class*="tabContent"]').count();
      
      tabTestResults.push({
        name: tab.name,
        exists: true,
        clickable: true,
        becomesActive: becameActive,
        hasContent: tabContent > 0,
        screenshot: filename
      });
      
      console.log(`      ✅ ${tab.name}: clickable=${true}, active=${becameActive}, content=${tabContent > 0}`);
    } else {
      tabTestResults.push({
        name: tab.name,
        exists: false
      });
      console.log(`      ❌ ${tab.name} tab not found`);
    }
  }

  return tabTestResults;
}

async function testResponsiveDesign(page, resultsDir) {
  console.log('  📱 Testing responsive behavior...');
  
  const viewports = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'laptop', width: 1024, height: 768 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  let responsiveResults = [];

  for (const viewport of viewports) {
    console.log(`    Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
    
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(1000);

    // Analyze layout at this viewport
    const sidebar = await page.locator('[class*="Sidebar"]').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    const sidebarBox = sidebarVisible ? await sidebar.boundingBox() : null;
    
    const mainContent = await page.locator('main').first();
    const mainBox = await mainContent.boundingBox();

    // Take screenshot
    const filename = `03-responsive-${viewport.name}.png`;
    await page.screenshot({ 
      path: path.join(resultsDir, filename),
      fullPage: true
    });

    responsiveResults.push({
      viewport: viewport.name,
      size: `${viewport.width}x${viewport.height}`,
      sidebarVisible,
      sidebarWidth: sidebarBox?.width || 0,
      mainContentLeft: mainBox?.x || 0,
      screenshot: filename
    });
  }

  // Return to desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(1000);

  return responsiveResults;
}

async function testInteractions(page, resultsDir) {
  console.log('  ⚡ Testing interactions...');
  
  // Test button hovers and clicks
  const buttons = await page.locator('button').all();
  console.log(`    Found ${buttons.length} buttons to test`);

  // Test a few key buttons
  const keyButtons = [
    'button:has-text("Convidar membro")',
    'button:has-text("Fazer upgrade")',
    '[class*="primaryButton"]',
    '[class*="secondaryButton"]'
  ];

  let interactionResults = [];

  for (const buttonSelector of keyButtons) {
    const button = page.locator(buttonSelector).first();
    const exists = await button.count() > 0;
    
    if (exists) {
      // Test hover effect
      await button.hover();
      await page.waitForTimeout(500);
      
      // Check if button is clickable
      const isEnabled = await button.isEnabled();
      
      interactionResults.push({
        selector: buttonSelector,
        exists: true,
        enabled: isEnabled,
        hoverable: true
      });
    } else {
      interactionResults.push({
        selector: buttonSelector,
        exists: false
      });
    }
  }

  // Test form interactions
  const inputs = await page.locator('input, select').count();
  console.log(`    Found ${inputs} form inputs`);

  // Take a final interaction screenshot
  await page.screenshot({ 
    path: path.join(resultsDir, '04-interactions-final.png')
  });

  return {
    buttons: interactionResults,
    formInputs: inputs
  };
}

async function generateReport(page, layoutAnalysis, resultsDir) {
  const report = {
    timestamp: new Date().toISOString(),
    url: page.url(),
    testStatus: 'SUCCESS',
    layout: {
      status: layoutAnalysis.layoutValid ? 'VALID' : 'ISSUES_FOUND',
      sidebar: {
        exists: layoutAnalysis.sidebar.exists,
        width: layoutAnalysis.sidebar.width,
        left: layoutAnalysis.sidebar.left,
        expectedWidth: 260,
        positionCorrect: layoutAnalysis.sidebar.left === 0 && layoutAnalysis.sidebar.width === 260
      },
      mainContent: {
        exists: layoutAnalysis.mainContent.exists,
        left: layoutAnalysis.mainContent.left,
        width: layoutAnalysis.mainContent.width,
        positionCorrect: layoutAnalysis.mainContent.left >= 260,
        overlapsWithSidebar: layoutAnalysis.contentOverlap
      }
    },
    functionality: {
      tabs: {
        count: layoutAnalysis.elements.adminTabs,
        expected: 4,
        working: layoutAnalysis.elements.adminTabs === 4
      },
      statsCards: {
        count: layoutAnalysis.elements.statsCards,
        expected: 3,
        correctGrid: layoutAnalysis.elements.statsCards === 3
      },
      usageCards: {
        count: layoutAnalysis.elements.usageCards,
        expected: 2,
        correctGrid: layoutAnalysis.elements.usageCards === 2
      }
    },
    screenshots: [
      '01-full-page-initial.png',
      '02-tab-visao-geral.png',
      '02-tab-membros.png',
      '02-tab-cobranca.png',
      '02-tab-configuracoes.png',
      '03-responsive-desktop.png',
      '03-responsive-laptop.png',
      '03-responsive-tablet.png',
      '03-responsive-mobile.png',
      '04-interactions-final.png'
    ],
    recommendations: []
  };

  // Generate recommendations
  if (!report.layout.sidebar.positionCorrect) {
    report.recommendations.push(`Sidebar positioning issue: width=${report.layout.sidebar.width}px (expected 260px), left=${report.layout.sidebar.left}px (expected 0px)`);
  }

  if (!report.layout.mainContent.positionCorrect) {
    report.recommendations.push(`Main content positioning issue: starts at x=${report.layout.mainContent.left}px (should be >= 260px to avoid sidebar overlap)`);
  }

  if (report.layout.mainContent.overlapsWithSidebar) {
    report.recommendations.push('Main content overlaps with sidebar - check CSS margins/positioning');
  }

  if (!report.functionality.tabs.working) {
    report.recommendations.push(`Navigation tabs issue: found ${report.functionality.tabs.count}, expected ${report.functionality.tabs.expected}`);
  }

  if (!report.functionality.statsCards.correctGrid) {
    report.recommendations.push(`Statistics cards grid issue: found ${report.functionality.statsCards.count}, expected ${report.functionality.statsCards.expected} in 3-column grid`);
  }

  if (!report.functionality.usageCards.correctGrid) {
    report.recommendations.push(`Usage cards grid issue: found ${report.functionality.usageCards.count}, expected ${report.functionality.usageCards.expected} in 2-column grid`);
  }

  // Save report
  fs.writeFileSync(
    path.join(resultsDir, 'comprehensive-test-report.json'),
    JSON.stringify(report, null, 2)
  );

  return report;
}

// Run the test
runComprehensiveWorkspaceTest().catch(console.error);