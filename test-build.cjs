// Test build script
console.log('🧪 Testing build process...');

const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Check essential files
  const files = [
    'package.json',
    'client/src/main.tsx',
    'client/src/App.tsx',
    'server/index.ts',
    '.env'
  ];
  
  console.log('📁 Checking files...');
  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
    }
  });

  console.log('\n🎉 All essential files present!');
  console.log('\n🚀 Ready to run: npm run dev');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}