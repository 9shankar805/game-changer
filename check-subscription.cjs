const http = require('http');

async function checkSubscription() {
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:5000/api/debug/push-status', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ json: () => JSON.parse(data) }));
      });
      req.on('error', reject);
    });
    const data = await response.json();
    
    console.log('Push Subscription Status:');
    console.log('- Subscriptions saved:', data.subscriptionsCount);
    console.log('- VAPID key available:', data.vapidKeyAvailable);
    
    if (data.subscriptions && data.subscriptions.length > 0) {
      console.log('\nSaved subscriptions:');
      data.subscriptions.forEach((sub, i) => {
        console.log(`${i + 1}. User: ${sub.userId}, Endpoint: ${sub.endpoint}`);
      });
    } else {
      console.log('\n❌ No subscriptions saved yet');
    }
  } catch (error) {
    console.error('❌ Error checking subscriptions:', error.message);
  }
}

checkSubscription();