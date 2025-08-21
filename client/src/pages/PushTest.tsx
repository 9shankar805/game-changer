import { useState } from 'react';
import { initPushNotifications, showBannerAndPush } from '@/lib/hardcodedPush';

export default function PushTest() {
  const [status, setStatus] = useState('');

  const handleInit = async () => {
    setStatus('Initializing...');
    try {
      const success = await initPushNotifications();
      setStatus(success ? '✅ Subscribed!' : '❌ Failed');
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  const handleTest = async () => {
    setStatus('Sending test...');
    try {
      await showBannerAndPush({
        title: 'Test from Siraha Bazaar',
        body: 'Push notifications are working!'
      });
      setStatus('✅ Test sent');
    } catch (error) {
      setStatus('❌ Send failed: ' + error.message);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Push Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={handleInit}
          className="w-full bg-blue-500 text-white p-3 rounded"
        >
          Subscribe to Push
        </button>
        
        <button 
          onClick={handleTest}
          className="w-full bg-green-500 text-white p-3 rounded"
        >
          Send Test Push
        </button>
        
        <div className="p-3 bg-gray-100 rounded">
          Status: {status}
        </div>
      </div>
    </div>
  );
}