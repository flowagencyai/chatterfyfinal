console.log('🧪 TESTE DE SINCRONIZAÇÃO ADMIN → PRICING');
console.log('═══════════════════════════════════════════════');

async function testAdminPricingSync() {
  try {
    // 1. Buscar planos via API pública (usada pela página pricing)
    console.log('\n1. 📡 Buscando planos via API pública...');
    const response = await fetch('http://localhost:8787/v1/plans');
    const data = await response.json();
    
    console.log(`   ✅ ${data.plans.length} planos encontrados`);
    
    // 2. Verificar dados específicos de cada plano
    console.log('\n2. 🔍 Verificando dados detalhados...');
    
    data.plans.forEach((plan, index) => {
      console.log(`\n   📦 PLANO ${index + 1}: ${plan.name} (${plan.code})`);
      console.log(`   ├─ 💰 Tokens: ${(plan.monthlyCreditsTokens / 1000000).toFixed(0)}M/mês`);
      console.log(`   ├─ 💾 Storage: ${plan.storageLimitMB >= 1000 ? (plan.storageLimitMB/1000)+'GB' : plan.storageLimitMB+'MB'}`);
      console.log(`   ├─ 📁 Max file: ${plan.maxFileSizeMB}MB`);
      console.log(`   └─ 🔧 Features: ${Object.keys(plan.features).join(', ')}`);
    });
    
    // 3. Verificar se página pricing carrega os dados
    console.log('\n3. 🌐 Testando carregamento da página pricing...');
    
    const pricingResponse = await fetch('http://localhost:3001/pricing');
    const pricingHtml = await pricingResponse.text();
    
    // Verificar se os dados atualizados aparecem na página
    const hasProPremium = pricingHtml.includes('Pro Premium');
    const has15MTokens = pricingHtml.includes('15M tokens');
    const has3GBStorage = pricingHtml.includes('3GB') || pricingHtml.includes('3000MB');
    
    console.log(`   ├─ Nome atualizado (Pro Premium): ${hasProPremium ? '✅' : '❌'}`);
    console.log(`   ├─ Tokens atualizados (15M): ${has15MTokens ? '✅' : '❌'}`);
    console.log(`   └─ Storage atualizado (3GB): ${has3GBStorage ? '✅' : '❌'}`);
    
    // 4. Resultado final
    console.log('\n4. 🎯 RESULTADO DA SINCRONIZAÇÃO:');
    
    if (hasProPremium && has15MTokens && has3GBStorage) {
      console.log('   ✅ SINCRONIZAÇÃO PERFEITA!');
      console.log('   🎉 Mudanças no admin aparecem na página pricing');
      return true;
    } else {
      console.log('   ⚠️  Sincronização parcial ou com problemas');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

// Simular environment de fetch no Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testAdminPricingSync()
  .then(success => {
    console.log('\n' + '═'.repeat(47));
    console.log(success ? '🎉 TESTE APROVADO: Admin-Pricing totalmente sincronizado!' : '❌ TESTE FALHADO: Problemas na sincronização');
    process.exit(success ? 0 : 1);
  });