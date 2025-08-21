import { sendFCMNotification } from './firebaseAdmin';
import PushNotificationService from './pushNotificationService';

interface NotificationData {
  title: string;
  body: string;
  data?: any;
  type?: string;
}

export class UnifiedNotificationService {
  // Store both FCM tokens and web-push subscriptions
  private static fcmTokens: Map<number, string> = new Map();
  private static webPushSubscriptions: Map<number, any> = new Map();

  static async registerFCMToken(userId: number, token: string) {
    this.fcmTokens.set(userId, token);
    console.log(`📱 FCM token registered for user ${userId}`);
  }

  static async registerWebPush(userId: number, subscription: any) {
    this.webPushSubscriptions.set(userId, subscription);
    await PushNotificationService.subscribeToPushNotifications(userId, subscription);
    console.log(`🔔 Web-push registered for user ${userId}`);
  }

  static async sendNotification(userId: number, notification: NotificationData) {
    let fcmSent = false;
    let webPushSent = false;

    // Try FCM first
    const fcmToken = this.fcmTokens.get(userId);
    if (fcmToken) {
      fcmSent = await sendFCMNotification(
        fcmToken,
        notification.title,
        notification.body,
        notification.data
      );
    }

    // Try web-push as fallback or additional delivery
    const webPushSub = this.webPushSubscriptions.get(userId);
    if (webPushSub) {
      webPushSent = await PushNotificationService.sendPushNotification(userId, {
        type: notification.type || 'general',
        title: notification.title,
        body: notification.body,
        data: notification.data || {}
      } as any);
    }

    console.log(`📤 Notification sent to user ${userId}: FCM=${fcmSent}, WebPush=${webPushSent}`);
    return fcmSent || webPushSent;
  }

  static async sendTestNotification(userId: number) {
    return this.sendNotification(userId, {
      title: '🔔 Notifications Active!',
      body: 'Both FCM and Web Push notifications are working. You\'ll receive order updates and offers.',
      type: 'test'
    });
  }

  static async sendOrderNotification(userId: number, orderId: number, status: string) {
    const statusMessages = {
      'confirmed': 'Your order has been confirmed and is being prepared',
      'preparing': 'Your order is being prepared by the store',
      'ready': 'Your order is ready for pickup/delivery',
      'out_for_delivery': 'Your order is out for delivery',
      'delivered': 'Your order has been delivered successfully'
    };

    return this.sendNotification(userId, {
      title: 'Order Update',
      body: statusMessages[status as keyof typeof statusMessages] || `Order status: ${status}`,
      data: { orderId, status },
      type: 'order_update'
    });
  }

  static getStats() {
    return {
      fcmTokens: this.fcmTokens.size,
      webPushSubscriptions: this.webPushSubscriptions.size,
      totalUsers: Math.max(this.fcmTokens.size, this.webPushSubscriptions.size)
    };
  }
}

export default UnifiedNotificationService;