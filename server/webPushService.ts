import webpush from 'web-push';

export class WebPushService {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BG5V1u2eNls8IInm93_F-ZBb2hXaEZIy4AjHBrIjDeClqi4wLVlVZ5x64WeMzFESgByQjeOtcL1UrGMGFQm0GlE';
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'demo-private-key';
    const contact = process.env.VAPID_CONTACT || 'mailto:admin@sirahabazaar.com';

    try {
      webpush.setVapidDetails(contact, vapidPublicKey, vapidPrivateKey);
      this.initialized = true;
      console.log('✅ WebPush service initialized');
    } catch (error) {
      console.warn('⚠️ WebPush initialization failed:', error.message);
    }
  }

  static async sendToAll(subscriptions: Map<string, any>, payload: any): Promise<number> {
    if (!this.initialized) {
      this.initialize();
    }

    let successCount = 0;
    const payloadString = JSON.stringify(payload);

    for (const [userId, subscription] of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payloadString);
        successCount++;
        console.log(`✅ Push sent to user ${userId}`);
      } catch (error) {
        console.log(`❌ Push failed for user ${userId}:`, error.message);
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          subscriptions.delete(userId);
        }
      }
    }

    return successCount;
  }

  static getConfiguration() {
    return {
      initialized: this.initialized,
      vapidPublicKey: process.env.VITE_VAPID_PUBLIC_KEY || 'BG5V1u2eNls8IInm93_F-ZBb2hXaEZIy4AjHBrIjDeClqi4wLVlVZ5x64WeMzFESgByQjeOtcL1UrGMGFQm0GlE',
      hasPrivateKey: !!(process.env.VAPID_PRIVATE_KEY),
      contact: process.env.VAPID_CONTACT || 'mailto:admin@sirahabazaar.com'
    };
  }
}

// Initialize on import
WebPushService.initialize();