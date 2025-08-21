import webpush from 'web-push';

// Test VAPID configuration
const vapidPublicKey = "BG5V1u2eNls8IInm93_F-ZBb2hXaEZIy4AjHBrIjDeClqi4wLVlVZ5x64WeMzFESgByQjeOtcL1UrGMGFQm0GlE";
const vapidPrivateKey = "x-WP8TzbDsKjEC80-V6GA4CkglSbCEcIftxT8Vgi6pg";

console.log('🧪 Testing Web Push Configuration...');

try {
  // Set VAPID details
  webpush.setVapidDetails(
    'mailto:sirahabazzar@gmail.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  
  console.log('✅ VAPID keys configured successfully');
  console.log('📊 Configuration Details:');
  console.log('- Public Key Length:', vapidPublicKey.length);
  console.log('- Private Key Length:', vapidPrivateKey.length);
  console.log('- Contact Email: sirahabazzar@gmail.com');
  
  // Test payload
  const testPayload = {
    title: 'Siraha Bazaar Test',
    body: 'Push notification system is working correctly!',
    icon: '/assets/icon2.png',
    badge: '/assets/icon2.png',
    data: {
      type: 'test',
      timestamp: Date.now()
    }
  };
  
  console.log('📤 Test Payload:', JSON.stringify(testPayload, null, 2));
  console.log('✅ Push notification system is properly configured');
  
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
}