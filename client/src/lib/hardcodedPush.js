// Hardcoded VAPID key for immediate fix
const VAPID_KEY = "BG5V1u2eNls8IInm93_F-ZBb2hXaEZIy4AjHBrIjDeClqi4wLVlVZ5x64WeMzFESgByQjeOtcL1UrGMGFQm0GlE";

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

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_KEY
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

export async function showBannerAndPush({ title, body }) {
  if (window.showBanner) {
    window.showBanner({ title, body });
  }

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