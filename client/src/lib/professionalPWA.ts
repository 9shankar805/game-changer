// Professional PWA Manager for Siraha Bazaar
// Handles installation, notifications, and background sync like WhatsApp

export class ProfessionalPWA {
  private static instance: ProfessionalPWA;
  private deferredPrompt: any = null;
  private isInstalled = false;
  private notificationPermission: NotificationPermission = 'default';

  private constructor() {
    this.init();
  }

  static getInstance(): ProfessionalPWA {
    if (!ProfessionalPWA.instance) {
      ProfessionalPWA.instance = new ProfessionalPWA();
    }
    return ProfessionalPWA.instance;
  }

  private async init() {
    // Check if already installed
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    // Register service worker
    await this.registerServiceWorker();
    
    // Request notification permission
    await this.requestNotificationPermission();
    
    // Setup background sync
    this.setupBackgroundSync();
    
    // Keep service worker alive
    this.keepServiceWorkerAlive();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);
        
        // Register FCM service worker
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ FCM Service Worker registered');
        
        return registration;
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  private async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      
      if (permission === 'granted') {
        this.showWelcomeNotification();
        return true;
      }
    }

    return false;
  }

  private showWelcomeNotification() {
    if (Notification.permission === 'granted') {
      new Notification('🎉 Welcome to Siraha Bazaar!', {
        body: 'You\'ll now receive real-time notifications about your orders, deliveries, and special offers. Thank you for choosing Siraha Bazaar!',
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: 'welcome',
        requireInteraction: false
      });
    }
  }

  private showInstallBanner() {
    // Create professional install banner
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <img src="/icon-96x96.png" alt="Siraha Bazaar" style="width: 48px; height: 48px; border-radius: 8px;">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">📱 Install Siraha Bazaar</div>
          <div style="font-size: 14px; opacity: 0.9;">Get the full app experience with offline access and instant notifications!</div>
        </div>
        <button id="install-btn" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">Install</button>
        <button id="dismiss-btn" style="
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
          cursor: pointer;
          font-size: 18px;
        ">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Handle install button click
    document.getElementById('install-btn')?.addEventListener('click', () => {
      this.installApp();
      banner.remove();
    });

    // Handle dismiss button click
    document.getElementById('dismiss-btn')?.addEventListener('click', () => {
      banner.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.getElementById('pwa-install-banner')) {
        banner.remove();
      }
    }, 10000);
  }

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA installed successfully');
        this.isInstalled = true;
        this.showInstallSuccessNotification();
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('❌ Installation failed:', error);
      return false;
    }
  }

  private showInstallSuccessNotification() {
    if (Notification.permission === 'granted') {
      new Notification('🎉 Siraha Bazaar Installed!', {
        body: 'Great! You can now access Siraha Bazaar directly from your home screen. Enjoy shopping with the full app experience!',
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: 'install-success'
      });
    }
  }

  private setupBackgroundSync() {
    // Register for background sync (like WhatsApp)
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        return registration.sync.register('background-sync');
      }).catch((error) => {
        console.log('Background sync not supported:', error);
      });
    }

    // Setup periodic background sync for notifications
    if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        return (registration as any).periodicSync.register('notification-sync', {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        });
      }).catch((error) => {
        console.log('Periodic sync not supported:', error);
      });
    }
  }

  private keepServiceWorkerAlive() {
    // Send keep-alive messages to service worker
    setInterval(() => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        navigator.serviceWorker.controller.postMessage(
          { type: 'KEEP_ALIVE' },
          [channel.port2]
        );
      }
    }, 30000); // Every 30 seconds
  }

  // Public methods
  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  hasNotificationPermission(): boolean {
    return this.notificationPermission === 'granted';
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (this.notificationPermission !== 'granted') {
      await this.requestNotificationPermission();
    }

    if (this.notificationPermission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        ...options
      });

      // Auto-close after 5 seconds if not interacted with
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // Share API integration
  async shareContent(shareData: ShareData): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        console.log('Share cancelled or failed:', error);
        return false;
      }
    }
    return false;
  }

  // Check if app is running in standalone mode
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Get app info
  getAppInfo() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone(),
      hasNotifications: this.hasNotificationPermission(),
      supportsShare: 'share' in navigator,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }
}

// Initialize PWA manager
export const pwaManager = ProfessionalPWA.getInstance();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pwaManager;
  });
} else {
  pwaManager;
}