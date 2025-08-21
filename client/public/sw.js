// Siraha Bazaar Professional PWA Service Worker
// Handles caching, background notifications, and offline functionality

const CACHE_NAME = 'siraha-bazaar-v2.0.0';
const STATIC_CACHE = 'siraha-static-v2.0.0';
const DYNAMIC_CACHE = 'siraha-dynamic-v2.0.0';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-96x96.png',
  '/icon-72x72.png',
  '/assets/icon1.png',
  '/assets/icon2.png',
  '/screenshot-wide.png',
  '/screenshot-narrow.png',
  '/sounds/notification.mp3',
  '/sounds/order-confirmed.mp3',
  '/sounds/payment-success.mp3'
];

// Professional PWA installation
self.addEventListener('install', (event) => {
  console.log('🚀 Siraha Bazaar PWA installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching app shell...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ PWA installed successfully');
        return self.skipWaiting();
      })
  );
});

// Clean activation with professional logging
self.addEventListener('activate', (event) => {
  console.log('⚡ Siraha Bazaar PWA activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ PWA activated successfully');
      return self.clients.claim();
    })
  );
});

// Professional fetch handling with offline support
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API calls for caching
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          
          // Cache static assets
          if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|mp3)$/)) {
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        }).catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 408 });
        });
      })
  );
});

// Professional background notification system
self.addEventListener('push', (event) => {
  console.log('🔔 Background push notification received:', event);
  
  const options = {
    body: 'You have a new update from Siraha Bazaar. Tap to view details and continue shopping!',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    silent: false,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '🛒 Open App',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: '❌ Later',
        icon: '/icon-96x96.png'
      }
    ],
    dir: 'ltr',
    lang: 'en',
    tag: 'siraha-notification',
    renotify: true
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || data.message || options.body;
      options.title = data.title || '🔔 Siraha Bazaar';
      options.data = { ...options.data, ...data.data };
      options.icon = data.icon || options.icon;
      options.badge = data.badge || options.badge;
      options.tag = data.type || options.tag;
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  // Always show notification when app is closed
  event.waitUntil(
    self.registration.showNotification(options.title || '🔔 Siraha Bazaar', options)
      .then(() => {
        console.log('✅ Background notification displayed');
      })
  );
});

// Professional notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Smart navigation based on notification data
  let urlToOpen = '/';
  const data = event.notification.data;
  
  if (data && data.type) {
    switch (data.type) {
      case 'order':
      case 'order_update':
        urlToOpen = data.orderId ? `/orders/${data.orderId}` : '/orders';
        break;
      case 'delivery':
      case 'delivery_assignment':
        urlToOpen = '/delivery-dashboard';
        break;
      case 'promotion':
        urlToOpen = '/promotions';
        break;
      case 'payment':
        urlToOpen = '/orders';
        break;
      default:
        urlToOpen = '/';
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
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
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + urlToOpen);
      }
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync offline data when connection is restored
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {
        console.log('📡 Background sync failed - will retry');
      })
    );
  }
});

// Keep service worker alive for better notification delivery
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    event.ports[0].postMessage({ type: 'ALIVE' });
  }
});

// Professional file handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FILE_HANDLER') {
    const files = event.data.files;
    console.log('📁 Files received via File Handler API:', files);
    
    event.ports[0].postMessage({
      type: 'FILES_RECEIVED',
      files: files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }))
    });
  }
});

// Share target handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHARE_TARGET') {
    const shareData = event.data.shareData;
    console.log('📤 Share data received:', shareData);
    
    clients.openWindow(`/share-target?title=${encodeURIComponent(shareData.title || '')}&text=${encodeURIComponent(shareData.text || '')}&url=${encodeURIComponent(shareData.url || '')}`);
  }
});

// Periodic background sync for notifications (like WhatsApp)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'notification-sync') {
    console.log('⏰ Periodic notification sync');
    event.waitUntil(
      fetch('/api/notifications/check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).then(response => response.json())
        .then(data => {
          if (data.hasNewNotifications) {
            // Show notification for new updates
            return self.registration.showNotification('🔔 Siraha Bazaar', {
              body: 'You have new updates waiting for you!',
              icon: '/icon-192x192.png',
              badge: '/icon-96x96.png',
              tag: 'periodic-sync'
            });
          }
        })
        .catch(() => {
          console.log('📡 Periodic sync failed');
        })
    );
  }
});

console.log('🚀 Siraha Bazaar Professional PWA Service Worker ready!');