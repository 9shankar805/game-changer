#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Push Notification Setup...\n');

const checks = [
  {
    name: 'Environment Variables',
    check: () => {
      const envPath = path.join(__dirname, '.env');
      if (!fs.existsSync(envPath)) return { success: false, message: '.env file not found' };
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasVapidPublic = envContent.includes('VITE_VAPID_PUBLIC_KEY=');
      const hasVapidPrivate = envContent.includes('VAPID_PRIVATE_KEY=');
      
      if (!hasVapidPublic || !hasVapidPrivate) {
        return { success: false, message: 'VAPID keys missing in .env' };
      }
      
      return { success: true, message: 'VAPID keys configured' };
    }
  },
  {
    name: 'Service Worker',
    check: () => {
      const swPath = path.join(__dirname, 'public', 'sw.js');
      if (!fs.existsSync(swPath)) return { success: false, message: 'Service worker not found' };
      
      const swContent = fs.readFileSync(swPath, 'utf8');
      const hasPushListener = swContent.includes("addEventListener('push'");
      
      if (!hasPushListener) {
        return { success: false, message: 'Push event listener missing' };
      }
      
      return { success: true, message: 'Service worker configured' };
    }
  },
  {
    name: 'Web Push Service',
    check: () => {
      const servicePath = path.join(__dirname, 'server', 'webPushService.ts');
      if (!fs.existsSync(servicePath)) return { success: false, message: 'WebPushService not found' };
      
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      const hasWebPush = serviceContent.includes('import webpush');
      
      if (!hasWebPush) {
        return { success: false, message: 'web-push import missing' };
      }
      
      return { success: true, message: 'WebPushService configured' };
    }
  },
  {
    name: 'Push Manager',
    check: () => {
      const managerPath = path.join(__dirname, 'client', 'src', 'lib', 'pushNotificationManager.js');
      if (!fs.existsSync(managerPath)) return { success: false, message: 'PushNotificationManager not found' };
      
      const managerContent = fs.readFileSync(managerPath, 'utf8');
      const hasVapidKey = managerContent.includes('BG5V1u2eNls8IInm93_F');
      
      if (!hasVapidKey) {
        return { success: false, message: 'VAPID key not hardcoded' };
      }
      
      return { success: true, message: 'PushNotificationManager configured' };
    }
  },
  {
    name: 'Test Page',
    check: () => {
      const testPath = path.join(__dirname, 'client', 'src', 'pages', 'CompletePushTest.tsx');
      if (!fs.existsSync(testPath)) return { success: false, message: 'CompletePushTest page not found' };
      
      return { success: true, message: 'Test page available' };
    }
  },
  {
    name: 'Server Routes',
    check: () => {
      const routesPath = path.join(__dirname, 'server', 'routes.ts');
      if (!fs.existsSync(routesPath)) return { success: false, message: 'routes.ts not found' };
      
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      const hasSubscribeRoute = routesContent.includes('/api/push/subscribe');
      const hasSendRoute = routesContent.includes('/api/push/send');
      
      if (!hasSubscribeRoute || !hasSendRoute) {
        return { success: false, message: 'Push API routes missing' };
      }
      
      return { success: true, message: 'Push API routes configured' };
    }
  },
  {
    name: 'Dependencies',
    check: () => {
      const packagePath = path.join(__dirname, 'package.json');
      if (!fs.existsSync(packagePath)) return { success: false, message: 'package.json not found' };
      
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasWebPush = packageContent.dependencies && packageContent.dependencies['web-push'];
      
      if (!hasWebPush) {
        return { success: false, message: 'web-push dependency missing' };
      }
      
      return { success: true, message: 'Dependencies installed' };
    }
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const result = check.check();
  const status = result.success ? '✅' : '❌';
  const number = (index + 1).toString().padStart(2, '0');
  
  console.log(`${status} ${number}. ${check.name}: ${result.message}`);
  
  if (!result.success) {
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Push notification system is ready.');
  console.log('\n📋 Next Steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:5000/complete-push-test');
  console.log('3. Click "Initialize Push Notifications"');
  console.log('4. Test notifications');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n🔗 Useful URLs:');
console.log('   Complete Test: http://localhost:5000/complete-push-test');
console.log('   FCM Test: http://localhost:5000/fcm-test');
console.log('   Main App: http://localhost:5000');

console.log('\n📡 API Endpoints:');
console.log('   POST /api/push/subscribe - Subscribe to notifications');
console.log('   POST /api/push/send - Send test notification');
console.log('   GET /api/push/system-status - Check system status');
console.log('   POST /api/test/notification-types - Test different types');