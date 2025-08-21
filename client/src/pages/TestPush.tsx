import React, { useState } from 'react';
import { initPushNotifications, showBannerAndPush } from '../lib/pushNotifications';

export default function TestPush() {
  const [status, setStatus] = useState('');

  const handleInit = async () => {
    setStatus('Initializing...');
    const success = await initPushNotifications();
    setStatus(success ? '✅ Initialized successfully' : '❌ Failed to initialize');
  };

  const handleTest = async () => {
    setStatus('Sending test notification...');
    await showBannerAndPush({
      title: 'Test Notification',
      body: 'This is a test of both banner and push notifications!'
    });
    setStatus('✅ Test notification sent');
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Push Notification Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={handleInit}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          1. Initialize Push Notifications
        </button>
        
        <button 
          onClick={handleTest}
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          2. Test Banner & Push
        </button>
        
        {status && (
          <div className="p-3 bg-gray-100 rounded text-sm">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}