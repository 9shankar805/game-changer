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

  // Test TypeScript compilation
  console.log('\n🔧 Testing TypeScript...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed');

  console.log('\n🎉 All tests passed! Ready to run.');
  console.log('\n🚀 Run: npm run dev');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}