// Universal push notification helper using banner notification mechanism
export class PushNotificationHelper {
  
  static async sendSirahaBazaarNotification(title: string, body: string, data: any = {}) {
    try {
      const subscriptions = global.pushSubscriptions || new Map();
      
      if (subscriptions.size > 0) {
        const { WebPushService } = await import('./webPushService');
        
        const pushPayload = {
          title: 'Siraha Bazaar',
          body: body,
          icon: '/assets/icon2.png',
          badge: '/assets/icon2.png',
          requireInteraction: true,
          data: {
            ...data,
            timestamp: Date.now()
          }
        };
        
        const successCount = await WebPushService.sendToAll(subscriptions, pushPayload);
        console.log(`✅ Siraha Bazaar notification sent to ${successCount} users: ${body}`);
        return successCount;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Siraha Bazaar notification error:', error);
      return 0;
    }
  }
}