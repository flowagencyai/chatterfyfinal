const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runDirectWorkspaceTest() {
  console.log('🚀 Starting direct workspace page test...');
  
  const resultsDir = path.join(__dirname, 'test-results-final');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    viewport: { width: 1280, height: 720 }
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // First, let's inject a session to bypass authentication
    console.log('🔧 Setting up mock authentication...');
    await page.goto('http://localhost:3001/');
    
    // Inject mock session data into localStorage
    await page.evaluate(() => {
      // Mock NextAuth session
      localStorage.setItem('nextauth.session', JSON.stringify({
        user: {
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
    });

    console.log('📍 Step 1: Navigating to workspace with mock session...');
    await page.goto('http://localhost:3001/workspace', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check if we're still on homepage or got to workspace
    if (currentUrl.includes('/workspace')) {
      console.log('✅ Successfully reached workspace page!');
      await runFullWorkspaceAnalysis(page, resultsDir);
    } else {
      console.log('⚠️ Still not on workspace page. Let\'s analyze what we have...');
      await analyzeCurrentPage(page, resultsDir, 'not-workspace');
      
      // Try a different approach - check if there are any navigation links to workspace
      const workspaceLinks = await page.locator('a[href*="/workspace"], button:has-text("Workspace"), button:has-text("Admin")').count();
      console.log('Workspace links found:', workspaceLinks);
      
      if (workspaceLinks > 0) {
        console.log('🔗 Found workspace links, trying to click...');
        await page.locator('a[href*="/workspace"], button:has-text("Workspace"), button:has-text("Admin")').first().click();
        await page.waitForTimeout(2000);
        
        if (page.url().includes('/workspace')) {
          console.log('✅ Successfully navigated to workspace via link!');
          await runFullWorkspaceAnalysis(page, resultsDir);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: path.join(resultsDir, 'error.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

async function runFullWorkspaceAnalysis(page, resultsDir) {
  console.log('🔍 Running full workspace analysis...');
  
  // Capture initial full page screenshot
  await page.screenshot({ 
    path: path.join(resultsDir, 'workspace-full-page.png'),
    fullPage: true 
  });

  // Analyze layout structure
  console.log('📐 Step 2: Analyzing layout structure...');
  
  // Check sidebar
  const sidebar = await page.locator('.workspace-sidebar, [class*="sidebar"], nav, [class*="Sidebar"]').first();
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
    console.log('✅ Sidebar found:', sidebarInfo);
  } else {
    console.log('❌ Sidebar not found');
  }

  // Check main content area
  const mainContent = await page.locator('main, .mainContent, [class*="main"]').first();
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
    console.log('✅ Main content found:', mainContentInfo);
  }

  // Check for workspace-specific elements
  const adminTitle = await page.locator('h1:has-text("Administração"), .adminTitle').count();
  const adminTabs = await page.locator('.adminTab, button:has-text("Visão Geral"), button:has-text("Membros")').count();
  const statsCards = await page.locator('.statCard, .stats-card').count();
  const usageCards = await page.locator('.usageCard, .usage-card').count();

  console.log('📊 Workspace elements found:');
  console.log('  Admin title:', adminTitle);
  console.log('  Admin tabs:', adminTabs);  
  console.log('  Stats cards:', statsCards);
  console.log('  Usage cards:', usageCards);

  // Test tab navigation if tabs exist
  if (adminTabs > 0) {
    console.log('🔄 Step 3: Testing tab navigation...');
    
    const expectedTabs = [
      { name: 'Visão Geral', selector: 'button:has-text("Visão Geral")' },
      { name: 'Membros', selector: 'button:has-text("Membros")' },  
      { name: 'Cobrança', selector: 'button:has-text("Cobrança")' },
      { name: 'Configurações', selector: 'button:has-text("Configurações")' }
    ];
    
    for (const tab of expectedTabs) {
      console.log(`  Testing tab: ${tab.name}`);
      
      const tabElement = page.locator(tab.selector).first();
      const tabExists = await tabElement.count() > 0;
      
      if (tabExists) {
        await tabElement.click();
        await page.waitForTimeout(1000);
        
        // Wait for any content to load
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ 
          path: path.join(resultsDir, `tab-${tab.name.toLowerCase().replace(' ', '-')}.png`),
          fullPage: true
        });
        console.log(`    ✅ ${tab.name} tab captured`);
      } else {
        console.log(`    ❌ ${tab.name} tab not found`);
      }
    }
  }

  // Test responsive design
  console.log('📱 Step 4: Testing responsive design...');
  
  // Test tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: path.join(resultsDir, 'workspace-tablet.png'),
    fullPage: true
  });

  // Test mobile view  
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: path.join(resultsDir, 'workspace-mobile.png'),
    fullPage: true
  });

  // Test mobile menu if exists
  const mobileMenu = await page.locator('.mobile-menu, .hamburger, button[aria-label*="menu"]').first();
  if (await mobileMenu.count() > 0) {
    await mobileMenu.click();
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(resultsDir, 'workspace-mobile-menu.png')
    });
  }

  // Back to desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(1000);

  // Final viewport screenshot
  await page.screenshot({ 
    path: path.join(resultsDir, 'workspace-desktop-final.png')
  });

  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    url: page.url(),
    testResults: {
      sidebar: sidebarInfo,
      mainContent: mainContentInfo,
      workspaceElements: {
        adminTitle: adminTitle > 0,
        adminTabs: adminTabs,
        statsCards: statsCards,
        usageCards: usageCards
      },
      layoutAnalysis: {
        sidebarWidth: sidebarInfo.width,
        sidebarPositionCorrect: sidebarInfo.left === 0 && sidebarInfo.width === 260,
        mainContentPositionCorrect: mainContentInfo.left >= 260,
        contentNotOverlapping: mainContentInfo.left > sidebarInfo.width
      }
    },
    screenshots: [
      'workspace-full-page.png',
      'workspace-desktop-final.png', 
      'workspace-tablet.png',
      'workspace-mobile.png'
    ],
    recommendations: []
  };

  // Add recommendations based on findings
  if (sidebarInfo.width !== 260) {
    report.recommendations.push(`Sidebar width is ${sidebarInfo.width}px, expected 260px`);
  }
  
  if (mainContentInfo.left <= sidebarInfo.width) {
    report.recommendations.push('Main content may be overlapping with sidebar');
  }

  if (adminTabs === 0) {
    report.recommendations.push('No workspace navigation tabs found');
  }

  if (statsCards !== 3) {
    report.recommendations.push(`Found ${statsCards} stats cards, expected 3 in grid layout`);
  }

  if (usageCards !== 2) {
    report.recommendations.push(`Found ${usageCards} usage cards, expected 2 in grid layout`);
  }

  fs.writeFileSync(
    path.join(resultsDir, 'workspace-comprehensive-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('✅ Comprehensive workspace analysis completed!');
  console.log('📋 Results saved to:', resultsDir);
  console.log('🎯 Key findings:');
  console.log(`  - Sidebar: ${sidebarInfo.exists ? '✅ Found' : '❌ Missing'} (${sidebarInfo.width}px wide)`);
  console.log(`  - Main Content: ${mainContentInfo.exists ? '✅ Found' : '❌ Missing'}`);
  console.log(`  - Admin Tabs: ${adminTabs} found`);
  console.log(`  - Stats Cards: ${statsCards} found`);
  console.log(`  - Usage Cards: ${usageCards} found`);
  
  if (report.recommendations.length > 0) {
    console.log('⚠️ Recommendations:');
    report.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
}

async function analyzeCurrentPage(page, resultsDir, prefix = '') {
  console.log('🔍 Analyzing current page...');
  
  const title = await page.title();
  const url = page.url();
  
  console.log('Page title:', title);
  console.log('Current URL:', url);
  
  await page.screenshot({ 
    path: path.join(resultsDir, `${prefix}-page-analysis.png`),
    fullPage: true 
  });
  
  // Check for any workspace-related elements
  const workspaceElements = await page.locator('*:has-text("workspace"), *:has-text("Workspace"), *:has-text("admin"), *:has-text("Admin")').count();
  console.log('Workspace-related elements found:', workspaceElements);
  
  return {
    title,
    url,
    workspaceElements
  };
}

// Run the test
runDirectWorkspaceTest().catch(console.error);