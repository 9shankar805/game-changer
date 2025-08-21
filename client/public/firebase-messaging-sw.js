// Firebase Cloud Messaging Service Worker
// Professional PWA notification handler for Siraha Bazaar
// Ensures notifications work even when app is completely closed

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
const firebaseConfig = {
  apiKey: "AIzaSyBbHSV2EJZ9BPE1C1ZC4_ZNYwFYJIR9VSo",
  authDomain: "myweb-1c1f37b3.firebaseapp.com",
  projectId: "myweb-1c1f37b3",
  storageBucket: "myweb-1c1f37b3.firebasestorage.app",
  messagingSenderId: "774950702828",
  appId: "1:774950702828:web:09c2dfc1198d45244a9fc9",
  measurementId: "G-XH9SP47FYT"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Professional notification handler - works when app is completely closed
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Background notification received:', payload);

  // Enhanced professional notification
  const notificationTitle = payload.notification?.title || '🛍️ Siraha Bazaar';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update from Siraha Bazaar. Tap to view details.',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    image: payload.notification?.imageUrl || '/icon-512x512.png',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: '🛒 Open App',
        icon: '/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss'
      }
    ],
    requireInteraction: true,
    silent: false,
    vibrate: [300, 100, 300, 100, 300],
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'en',
    tag: payload.data?.type || 'siraha-notification',
    renotify: true
  };

  // Always show notification when app is closed
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Enhanced push event handler for complete app closure scenarios
self.addEventListener('push', (event) => {
  console.log('🚀 Push event received (app closed):', event);

  let notificationTitle = '🔔 Siraha Bazaar';
  let notificationOptions = {
    body: 'You have a new notification from Siraha Bazaar. Tap to open the app.',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    requireInteraction: true,
    silent: false,
    vibrate: [300, 100, 300, 100, 300],
    timestamp: Date.now(),
    actions: [
      { action: 'open', title: '🛒 Open App', icon: '/icon-96x96.png' },
      { action: 'dismiss', title: '❌ Later' }
    ],
    dir: 'ltr',
    lang: 'en',
    tag: 'siraha-background',
    renotify: true
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📦 Background push payload:', payload);
      
      notificationTitle = payload.title || notificationTitle;
      notificationOptions = {
        ...notificationOptions,
        body: payload.body || payload.message || notificationOptions.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-96x96.png',
        image: payload.image || payload.imageUrl,
        data: payload.data || {},
        tag: payload.data?.type || 'siraha-notification'
      };
    } catch (error) {
      console.error('❌ Error parsing background push data:', error);
    }
  }

  // Critical: Always show notification when app is completely closed
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('✅ Background notification displayed successfully');
      })
      .catch((error) => {
        console.error('❌ Failed to show background notification:', error);
      })
  );
});

// Professional notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Smart URL routing based on notification type
  const data = event.notification.data;
  let urlToOpen = '/';

  if (data) {
    switch (data.type) {
      case 'order_update':
      case 'order':
        urlToOpen = data.orderId ? `/orders/${data.orderId}` : '/orders';
        break;
      case 'delivery_assignment':
      case 'delivery':
        urlToOpen = data.orderId ? `/delivery/${data.orderId}` : '/delivery-dashboard';
        break;
      case 'promotion':
        urlToOpen = '/promotions';
        break;
      case 'new_order':
        urlToOpen = '/seller/orders';
        break;
      case 'payment':
        urlToOpen = data.orderId ? `/orders/${data.orderId}` : '/orders';
        break;
      case 'product':
        urlToOpen = data.productId ? `/products/${data.productId}` : '/products';
        break;
      case 'store':
        urlToOpen = '/seller/dashboard';
        break;
      case 'banner_notification':
      case 'banner':
        urlToOpen = data.linkUrl || '/';
        break;
      default:
        urlToOpen = '/';
    }
  }

  // Professional app opening logic
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: data,
            url: urlToOpen
          });
          return;
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + urlToOpen);
      }
    })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-notification-sync') {
    console.log('🔄 Background sync for notifications');
    event.waitUntil(
      // Sync pending notifications when connection is restored
      fetch('/api/notifications/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {
        // Fail silently if sync fails
        console.log('📡 Notification sync failed - will retry later');
      })
    );
  }
});

// Keep service worker alive for better notification delivery
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    // Respond to keep-alive ping
    event.ports[0].postMessage({ type: 'ALIVE' });
  }
});

console.log('🚀 Siraha Bazaar FCM Service Worker initialized - Ready for background notifications');