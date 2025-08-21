console.log('🚀 Siraha Bazaar Service Worker loaded');

// Install event - immediately take control
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event - claim all clients
self.addEventListener('activate', function(event) {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', function(event) {
  console.log('🔔 Push notification received:', event);
  
  let notificationData = {
    title: 'Siraha Bazaar',
    body: 'You have a new notification!',
    icon: '/assets/icon2.png',
    badge: '/assets/icon2.png',
    requireInteraction: true,
    data: {
      timestamp: Date.now(),
      url: '/'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('📊 Push data received:', pushData);
      
      notificationData = {
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        requireInteraction: pushData.requireInteraction !== false,
        data: {
          ...notificationData.data,
          ...pushData.data,
          type: pushData.data?.type || 'general',
          url: pushData.data?.url || '/'
        }
      };
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
    }
  }

  console.log('📤 Showing notification:', notificationData);
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/assets/icon2.png'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ]
    })
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', function(event) {
  console.log('👆 Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || '/';
  
  if (action === 'close') {
    console.log('❌ Notification dismissed');
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        console.log('🔍 Found clients:', clientList.length);
        
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin)) {
            console.log('✅ Focusing existing window');
            return client.focus();
          }
        }
        
        // Open new window
        console.log('🎆 Opening new window:', url);
        return clients.openWindow(url);
      })
      .catch(function(error) {
        console.error('❌ Error handling notification click:', error);
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', function(event) {
  console.log('🔄 Background sync:', event.tag);
});

// Error handling
self.addEventListener('error', function(event) {
  console.error('❌ Service Worker error:', event);
});

console.log('✅ Siraha Bazaar Service Worker ready');