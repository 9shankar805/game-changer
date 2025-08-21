// Initialize push notifications
export async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push messaging not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('❌ Notification permission denied');
      return false;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.log('❌ VAPID public key not found');
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    });

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    if (response.ok) {
      console.log('✅ Push subscription successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Push setup failed:', error);
  }
  return false;
}

// Show banner and send push notification
export async function showBannerAndPush({ title, body }) {
  // Show banner in page
  if (window.showBanner) {
    window.showBanner({ title, body });
  }

  // Send push notification
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    });
    console.log('✅ Push notification sent');
  } catch (error) {
    console.error('❌ Push send failed:', error);
  }
}