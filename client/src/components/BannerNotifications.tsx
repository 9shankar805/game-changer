import React, { useEffect } from 'react';
import { initPushNotifications, showBannerAndPush } from '../lib/pushNotifications';

export function BannerNotifications() {
  useEffect(() => {
    // Initialize push notifications when component mounts
    initPushNotifications();
  }, []);

  const handleTestNotification = async () => {
    await showBannerAndPush({
      title: 'Test Notification',
      body: 'This is a test of both banner and push notifications!'
    });
  };

  return (
    <div className="p-4">
      <button 
        onClick={handleTestNotification}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Banner & Push
      </button>
    </div>
  );
}