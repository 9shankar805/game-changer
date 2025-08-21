import { useEffect } from 'react';

export function usePushNotifications() {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('🔔 Setting up background banner notifications...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      const permission = await Notification.requestPermission();
      console.log('📋 Notification permission:', permission);
      
      if (permission === 'granted') {
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        console.log('🔑 VAPID key available:', !!vapidKey, 'Length:', vapidKey?.length);
        
        if (!vapidKey) {
          console.warn('⚠️ No VAPID key found - using fallback');
          try {
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
              console.log('✅ Using existing push subscription');
              await sendSubscriptionToServer(existingSubscription);
              return;
            }
          } catch (error) {
            console.log('⚠️ No existing subscription found');
          }
          return;
        }
        
        try {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          });

          console.log('✅ Background notification subscription created');
          console.log('📱 Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
          
          await sendSubscriptionToServer(subscription);
        } catch (subscribeError) {
          console.error('❌ Failed to create push subscription:', subscribeError);
          try {
            const fallbackSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true
            });
            console.log('✅ Fallback subscription created without VAPID');
            await sendSubscriptionToServer(fallbackSubscription);
          } catch (fallbackError) {
            console.error('❌ Fallback subscription also failed:', fallbackError);
          }
        }
      } else {
        console.log('❌ Notification permission denied - background notifications disabled');
      }
    } catch (error) {
      console.error('❌ Background notification setup failed:', error);
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      console.log('📤 Sending subscription to server...');
      const subscriptionData = subscription.toJSON();
      
      // Validate subscription data
      if (!subscriptionData.endpoint) {
        console.warn('⚠️ Invalid subscription - missing endpoint');
        return;
      }
      
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscriptionData,
          userId: localStorage.getItem('userId') || 'anonymous'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Background notifications enabled for banners:', result);
      } else {
        const error = await response.text();
        console.log('⚠️ Push notification registration skipped:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to send subscription to server:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };
}