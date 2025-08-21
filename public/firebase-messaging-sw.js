self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Siraha Bazaar';
  const options = {
    body: data.body || 'New notification',
    icon: '/assets/icon2.png'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function() {
  self.clients.claim();
});