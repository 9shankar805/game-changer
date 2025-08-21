#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Siraha Bazaar with Push Notification Testing...');
console.log('📍 Project Directory:', __dirname);

// Start the development server
const server = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('spawn', () => {
  console.log('✅ Development server started');
  console.log('');
  console.log('🔗 Available Test URLs:');
  console.log('   Main App: http://localhost:5000');
  console.log('   Complete Push Test: http://localhost:5000/complete-push-test');
  console.log('   FCM Test: http://localhost:5000/fcm-test');
  console.log('   Push Test: http://localhost:5000/push-test');
  console.log('');
  console.log('📡 Push Notification API Endpoints:');
  console.log('   Subscribe: POST /api/push/subscribe');
  console.log('   Send: POST /api/push/send');
  console.log('   System Status: GET /api/push/system-status');
  console.log('   Test Types: POST /api/test/notification-types');
  console.log('');
  console.log('🧪 Testing Instructions:');
  console.log('1. Open http://localhost:5000/complete-push-test');
  console.log('2. Click "Initialize Push Notifications"');
  console.log('3. Allow notification permissions when prompted');
  console.log('4. Test different notification types');
  console.log('5. Check browser console for detailed logs');
  console.log('');
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🛑 Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});