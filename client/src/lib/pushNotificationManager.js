// Complete Push Notification Manager for Siraha Bazaar
class PushNotificationManager {
  constructor() {
    this.vapidKey = "BG5V1u2eNls8IInm93_F-ZBb2hXaEZIy4AjHBrIjDeClqi4wLVlVZ5x64WeMzFESgByQjeOtcL1UrGMGFQm0GlE";
    this.isSupported = this.checkSupport();
    this.isInitialized = false;
    this.subscription = null;
    
    console.log('🚀 PushNotificationManager initialized');
    console.log('📊 Browser support:', this.isSupported);
  }

  checkSupport() {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = 'Notification' in window;
    
    console.log('🔍 Checking browser support:');
    console.log('- Service Worker:', hasServiceWorker);
    console.log('- Push Manager:', hasPushManager);
    console.log('- Notifications:', hasNotifications);
    
    return hasServiceWorker && hasPushManager && hasNotifications;
  }

  async initialize() {
    if (!this.isSupported) {
      console.error('❌ Push notifications not supported in this browser');
      return false;
    }

    if (this.isInitialized) {
      console.log('✅ Push notifications already initialized');
      return true;
    }

    try {
      console.log('🔧 Initializing push notifications...');
      
      // Register service worker
      const registration = await this.registerServiceWorker();
      if (!registration) {
        throw new Error('Service worker registration failed');
      }

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      const subscription = await this.subscribeToPush(registration);
      if (!subscription) {
        throw new Error('Push subscription failed');
      }

      // Send subscription to server
      const serverResponse = await this.sendSubscriptionToServer(subscription);
      if (!serverResponse) {
        throw new Error('Failed to register subscription with server');
      }

      this.isInitialized = true;
      this.subscription = subscription;
      
      console.log('✅ Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Push notification initialization failed:', error);
      return false;
    }
  }

  async registerServiceWorker() {
    try {
      console.log('📝 Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service worker registered:', registration.scope);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');
      
      return registration;
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      return null;
    }
  }

  async requestPermission() {
    console.log('🔔 Requesting notification permission...');
    
    const permission = await Notification.requestPermission();
    
    console.log('📊 Notification permission:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
    } else if (permission === 'denied') {
      console.log('❌ Notification permission denied');
    } else {
      console.log('⚠️ Notification permission dismissed');
    }
    
    return permission;
  }

  async subscribeToPush(registration) {
    try {
      console.log('📡 Subscribing to push notifications...');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.vapidKey
      });
      
      console.log('✅ Push subscription created');
      console.log('📊 Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
      
      return subscription;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      return null;
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      console.log('📤 Sending subscription to server...');
      
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Subscription registered with server:', result);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to register subscription with server:', error);
      return false;
    }
  }

  async sendTestNotification(title = 'Test Notification', body = 'This is a test from Siraha Bazaar!') {
    try {
      console.log('🧪 Sending test notification...');
      
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, body })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Test notification sent:', result);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      return false;
    }
  }

  async showLocalNotification(title, body, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.log('⚠️ Cannot show local notification - no permission');
      return false;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/assets/icon2.png',
        badge: '/assets/icon2.png',
        requireInteraction: true,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      console.log('✅ Local notification shown');
      return true;
    } catch (error) {
      console.error('❌ Failed to show local notification:', error);
      return false;
    }
  }

  async getSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      return {
        isSubscribed: !!subscription,
        subscription: subscription,
        permission: Notification.permission,
        isSupported: this.isSupported
      };
    } catch (error) {
      console.error('❌ Failed to get subscription status:', error);
      return {
        isSubscribed: false,
        subscription: null,
        permission: 'default',
        isSupported: this.isSupported
      };
    }
  }

  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Unsubscribed from push notifications');
        this.isInitialized = false;
        this.subscription = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to unsubscribe:', error);
      return false;
    }
  }
}

// Create global instance
window.pushManager = new PushNotificationManager();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Auto-initializing push notifications...');
  await window.pushManager.initialize();
});

// Export for module usage
export default PushNotificationManager;
export { PushNotificationManager };