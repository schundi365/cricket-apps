const axios = require('axios');
const WebSocket = require('ws');

console.log('🧪 Testing Forex App Setup...\n');

// Test 1: Check if dependencies are installed
console.log('✓ Dependencies installed');

// Test 2: Test forex service
const forexService = require('./server/services/forexService');

async function runTests() {
  try {
    // Test getting rates
    console.log('\n📊 Testing exchange rate fetching...');
    const rates = await forexService.getRates('USD');
    console.log(`✓ Fetched ${Object.keys(rates.rates).length} currency rates`);
    console.log(`  Sample: 1 USD = ${rates.rates.EUR.toFixed(4)} EUR`);

    // Test conversion
    console.log('\n💱 Testing currency conversion...');
    const conversion = await forexService.convert('USD', 'EUR', 100);
    console.log(`✓ Converted: ${conversion.amount} ${conversion.from} = ${conversion.result.toFixed(2)} ${conversion.to}`);

    // Test multiple pairs
    console.log('\n📈 Testing multiple currency pairs...');
    const pairs = await forexService.getMultiplePairRates(['EUR/USD', 'GBP/USD', 'USD/JPY']);
    console.log(`✓ Fetched ${Object.keys(pairs).length} currency pairs`);
    Object.entries(pairs).forEach(([pair, data]) => {
      console.log(`  ${pair}: ${data.rate.toFixed(4)}`);
    });

    // Test supported currencies
    console.log('\n🌍 Testing supported currencies...');
    const currencies = await forexService.getSupportedCurrencies();
    console.log(`✓ ${currencies.length} currencies supported`);
    console.log(`  Examples: ${currencies.slice(0, 10).join(', ')}...`);

    console.log('\n✅ All tests passed! Your forex app is ready to run.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Start trading!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check your internet connection');
    console.log('   - Verify API is accessible');
    console.log('   - Try again in a few seconds\n');
    process.exit(1);
  }
}

runTests();
