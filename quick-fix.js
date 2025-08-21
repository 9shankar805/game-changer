// Quick diagnostic and fix script
console.log('🔧 Running Siraha Bazaar Quick Fix...');

const fs = require('fs');
const path = require('path');

// Check if essential files exist
const essentialFiles = [
  'package.json',
  'client/src/main.tsx',
  'client/src/App.tsx',
  'server/index.ts',
  '.env'
];

console.log('📁 Checking essential files...');
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Check if node_modules exists
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules - Found');
} else {
  console.log('❌ node_modules - Missing (run: npm install)');
}

// Check package.json scripts
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('\n📋 Available scripts:');
  Object.keys(pkg.scripts).forEach(script => {
    console.log(`  - npm run ${script}`);
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}

// Check .env file
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const hasDatabase = envContent.includes('DATABASE_URL');
  console.log(`\n🔐 Environment: ${hasDatabase ? '✅ DATABASE_URL found' : '❌ DATABASE_URL missing'}`);
} catch (error) {
  console.log('\n❌ Could not read .env file');
}

console.log('\n🚀 Quick Fix Steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:5000');
console.log('4. Check browser console for errors');
console.log('\n💡 If still white screen:');
console.log('- Check browser developer tools (F12)');
console.log('- Look for JavaScript errors in console');
console.log('- Verify database connection');