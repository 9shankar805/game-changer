import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting minimal build process...');

// Clean dist directory
console.log('🧹 Cleaning dist directory...');
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
}

// Build client first
console.log('🎨 Building client...');
try {
  execSync('npm run build:client', { stdio: 'inherit' });
  console.log('✅ Client build completed successfully!');
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  process.exit(1);
}

// Copy server files without TypeScript compilation
console.log('📁 Copying server files...');
try {
  // Create dist/server directory
  fs.mkdirSync(path.join(__dirname, 'dist', 'server'), { recursive: true });
  
  // Copy all server files as-is (we'll run them with tsx)
  execSync('xcopy /E /I /Y server dist\\server', { stdio: 'inherit' });
  
  // Copy shared files
  fs.mkdirSync(path.join(__dirname, 'dist', 'shared'), { recursive: true });
  execSync('xcopy /E /I /Y shared dist\\shared', { stdio: 'inherit' });
  
  // Copy necessary config files
  const configFiles = ['vite.config.ts', 'package.json', 'tsconfig.json'];
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('dist', file));
    }
  });
  
  console.log('✅ Server files copied successfully!');
} catch (error) {
  console.error('❌ Server copy failed:', error.message);
  process.exit(1);
}

console.log('✨ Minimal build completed! ✨');
console.log('💡 Note: Server will run with tsx (TypeScript runtime)');