import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting build process...');

// Clean dist directory
console.log('🧹 Cleaning dist directory...');
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
}

// Build server
console.log('🔨 Building server...');
try {
  execSync('npx tsc -p tsconfig.server.json', { stdio: 'inherit' });
  console.log('✅ Server build completed successfully!');
} catch (error) {
  console.error('❌ Server build failed:', error);
  process.exit(1);
}

// Build client
console.log('🎨 Building client...');
try {
  execSync('npm run build:client', { stdio: 'inherit' });
  console.log('✅ Client build completed successfully!');
} catch (error) {
  console.error('❌ Client build failed:', error);
  process.exit(1);
}

console.log('✨ Build completed successfully! ✨');
