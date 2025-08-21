import admin from 'firebase-admin';
import { storage } from './storage';

export interface FirebaseNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface FirebaseNotificationOptions {
  priority?: 'high' | 'normal';
  timeToLive?: number;
  collapseKey?: string;
  badge?: number;
  sound?: string;
}

export class FirebaseService {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        console.log('✅ Firebase already initialized');
        this.initialized = true;
        return;
      }

      // Try to load service account from local file first (more reliable)
      let serviceAccount = null;
      
      try {
        const fs = require('fs');
        const path = require('path');
        const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = fs.readFileSync(serviceAccountPath, 'utf8');
          console.log('✅ Found local Firebase service account file');
        }
      } catch (fileError) {
        console.log('No local service account file found');
      }
      
      // Fallback to environment variable if local file not found
      if (!serviceAccount) {
        serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      }
      
      if (!serviceAccount || serviceAccount.trim() === '') {
        console.log('Firebase service account not configured. Using minimal configuration.');
        // Initialize with minimal config for development
        admin.initializeApp({
          projectId: 'myweb-1c1f37b3',
        });
        this.initialized = true;
        return;
      }

      // Clean and parse service account
      const cleanServiceAccount = serviceAccount.trim();
      let serviceAccountObj;
      
      try {
        serviceAccountObj = JSON.parse(cleanServiceAccount);
        console.log('✅ Successfully parsed service account JSON');
      } catch (parseError) {
        console.error('Failed to parse Firebase service account JSON:', parseError);
        console.log('Using minimal configuration instead');
        admin.initializeApp({
          projectId: 'myweb-1c1f37b3',
        });
        this.initialized = true;
        return;
      }

      // Initialize Firebase Admin SDK with your Android project configuration
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountObj),
        projectId: serviceAccountObj.project_id || 'myweb-1c1f37b3',
        databaseURL: `https://myweb-1c1f37b3-default-rtdb.firebaseio.com/`,
        storageBucket: 'myweb-1c1f37b3.firebasestorage.app'
      });

      this.initialized = true;
      console.log('✅ Firebase service initialized successfully with full credentials');
    } catch (error) {
      console.error('Failed to initialize Firebase service:', error);
      // Initialize with minimal config as fallback
      try {
        if (admin.apps.length === 0) {
          admin.initializeApp({
            projectId: 'myweb-1c1f37b3',
          });
        }
        this.initialized = true;
        console.log('✅ Firebase initialized with minimal configuration');
      } catch (fallbackError) {
        console.error('Failed to initialize Firebase with fallback:', fallbackError);
      }
    }
  }

  static isConfigured(): boolean {
    return this.initialized;
  }

  /**
   * Send notification to a specific device token
   */
  static async sendToDevice(
    token: string,
    payload: FirebaseNotificationPayload,
    options: FirebaseNotificationOptions = {}
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Firebase not configured. Cannot send push notification.');
      return false;
    }

    try {
      const message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: options.priority || 'high',
          ttl: options.timeToLive || 3600000,
          collapseKey: options.collapseKey,
          notification: {
            sound: options.sound || 'default',
            clickAction: 'FCM_PLUGIN_ACTIVITY',
            channelId: 'siraha_bazaar_notifications',
            icon: 'ic_notification',
            color: '#0079F2',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
              alert: {
                title: payload.title,
                body: payload.body,
              },
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
        },
        webpush: {
          headers: {
            'Urgency': 'high',
            'TTL': '86400',
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            image: payload.imageUrl,
            data: payload.data,
            requireInteraction: true,
            silent: false,
            tag: payload.data?.type || 'general',
            actions: [
              {
                action: 'view',
                title: '👀 View Details',
                icon: '/icon-96x96.png'
              },
              {
                action: 'dismiss',
                title: '❌ Dismiss'
              }
            ],
            vibrate: [300, 100, 300, 100, 300],
            dir: 'ltr',
            lang: 'en'
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple devices
   */
  static async sendToMultipleDevices(
    tokens: string[],
    payload: FirebaseNotificationPayload,
    options: FirebaseNotificationOptions = {}
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isConfigured()) {
      console.warn('Firebase not configured. Cannot send push notifications.');
      return { successCount: 0, failureCount: tokens.length };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: options.priority || 'high',
          ttl: options.timeToLive || 3600000,
          collapseKey: options.collapseKey,
          notification: {
            sound: options.sound || 'default',
            clickAction: 'FCM_PLUGIN_ACTIVITY',
            channelId: 'siraha_bazaar_notifications',
            icon: 'ic_notification',
            color: '#0079F2',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
              alert: {
                title: payload.title,
                body: payload.body,
              },
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
        },
        webpush: {
          headers: {
            'Urgency': 'high',
            'TTL': '86400',
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            image: payload.imageUrl,
            data: payload.data,
            requireInteraction: true,
            silent: false,
            tag: payload.data?.type || 'general',
            actions: [
              {
                action: 'view',
                title: '👀 View Details',
                icon: '/icon-96x96.png'
              },
              {
                action: 'dismiss',
                title: '❌ Dismiss'
              }
            ],
            vibrate: [300, 100, 300, 100, 300],
            dir: 'ltr',
            lang: 'en'
          },
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Successfully sent ${response.successCount} messages`);
      console.log(`Failed to send ${response.failureCount} messages`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Error sending messages:', error);
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  /**
   * Send notification to users by role
   */
  static async sendToUsersByRole(
    role: string,
    payload: FirebaseNotificationPayload,
    options: FirebaseNotificationOptions = {}
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      // Get all device tokens for users with the specified role
      const tokens = await storage.getDeviceTokensByRole(role);
      
      if (tokens.length === 0) {
        console.log(`No device tokens found for role: ${role}`);
        return { successCount: 0, failureCount: 0 };
      }

      return await this.sendToMultipleDevices(tokens, payload, options);
    } catch (error) {
      console.error('Error sending notifications by role:', error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send order notification to customer
   */
  static async sendOrderNotification(
    userId: number,
    orderId: number,
    status: string,
    customMessage?: string
  ): Promise<boolean> {
    const statusMessages = {
      pending: {
        title: '✅ Order Confirmed - Siraha Bazaar',
        body: `Great news! Your order #${orderId} has been successfully placed and confirmed. We're now processing your order and will keep you updated on its progress. Thank you for choosing Siraha Bazaar!`
      },
      processing: {
        title: '⏳ Order Being Prepared - Siraha Bazaar',
        body: `Your order #${orderId} is currently being prepared by our store partners. We'll notify you once it's ready for pickup. Thank you for your patience!`
      },
      shipped: {
        title: '📦 Order Shipped - Siraha Bazaar',
        body: `Exciting update! Your order #${orderId} has been shipped and is on its way to you. Track your order for real-time delivery updates!`
      },
      out_for_delivery: {
        title: '🚛 Out for Delivery - Siraha Bazaar',
        body: `Your order #${orderId} is out for delivery! Our delivery partner is on the way to your location. Please keep your phone handy for delivery updates.`
      },
      delivered: {
        title: '🎉 Order Delivered - Siraha Bazaar',
        body: `Congratulations! Your order #${orderId} has been successfully delivered. We hope you love your purchase! Please rate your experience to help us serve you better.`
      },
      cancelled: {
        title: '❌ Order Cancelled - Siraha Bazaar',
        body: `We're sorry to inform you that your order #${orderId} has been cancelled. If you have any questions, our customer support team is here to help. Thank you for understanding.`
      },
    };

    const statusInfo = statusMessages[status as keyof typeof statusMessages] || {
      title: '📋 Order Update - Siraha Bazaar',
      body: customMessage || `Your order #${orderId} status: ${status}`
    };

    const payload: FirebaseNotificationPayload = {
      title: statusInfo.title,
      body: statusInfo.body,
      imageUrl: '/icon-192x192.png',
      data: {
        type: 'order_update',
        orderId: orderId.toString(),
        status,
        userId: userId.toString(),
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png'
      },
    };

    try {
      const tokens = await storage.getDeviceTokensByUserId(userId);
      
      if (tokens.length === 0) {
        console.log(`No device tokens found for user: ${userId}`);
        return false;
      }

      const result = await this.sendToMultipleDevices(tokens, payload, { priority: 'high', sound: 'notification' });
      return result.successCount > 0;
    } catch (error) {
      console.error('Error sending order notification:', error);
      return false;
    }
  }

  /**
   * Send delivery assignment notification
   */
  static async sendDeliveryAssignmentNotification(
    deliveryPartnerId: number,
    orderId: number,
    pickupAddress: string,
    deliveryAddress: string,
    estimatedDistance?: string,
    estimatedEarnings?: string
  ): Promise<boolean> {
    const payload: FirebaseNotificationPayload = {
      title: '🚚 New Delivery Opportunity - Siraha Bazaar',
      body: `Great news! A new delivery assignment is available. Pickup: ${pickupAddress.substring(0, 30)}... → Delivery: ${deliveryAddress.substring(0, 30)}...${estimatedDistance ? ` Distance: ${estimatedDistance}` : ''}${estimatedEarnings ? ` | Earnings: ₹${estimatedEarnings}` : ''}. Accept now to start earning!`,
      imageUrl: '/icon-192x192.png',
      data: {
        type: 'delivery_assignment',
        orderId: orderId.toString(),
        deliveryPartnerId: deliveryPartnerId.toString(),
        pickupAddress,
        deliveryAddress,
        estimatedDistance: estimatedDistance || '',
        estimatedEarnings: estimatedEarnings || '',
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png'
      },
    };

    try {
      const tokens = await storage.getDeviceTokensByUserId(deliveryPartnerId);
      
      if (tokens.length === 0) {
        console.log(`No device tokens found for delivery partner: ${deliveryPartnerId}`);
        return false;
      }

      const result = await this.sendToMultipleDevices(tokens, payload, { 
        priority: 'high',
        sound: 'delivery_alert',
        badge: 1
      });
      return result.successCount > 0;
    } catch (error) {
      console.error('Error sending delivery assignment notification:', error);
      return false;
    }
  }

  /**
   * Send promotional notification to customers
   */
  static async sendPromotionalNotification(
    title: string,
    message: string,
    imageUrl?: string,
    targetUserIds?: number[],
    promoCode?: string,
    validUntil?: string
  ): Promise<{ successCount: number; failureCount: number }> {
    const enhancedTitle = title.includes('Siraha Bazaar') ? title : `🎁 ${title} - Siraha Bazaar`;
    const enhancedMessage = `${message}${promoCode ? ` Use code: ${promoCode}` : ''}${validUntil ? ` Valid until: ${validUntil}` : ''} Don't miss out on this amazing opportunity! Shop now and save more with Siraha Bazaar.`;
    
    const payload: FirebaseNotificationPayload = {
      title: enhancedTitle,
      body: enhancedMessage,
      imageUrl: imageUrl || '/icon-192x192.png',
      data: {
        type: 'promotion',
        timestamp: Date.now().toString(),
        promoCode: promoCode || '',
        validUntil: validUntil || '',
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png'
      },
    };

    try {
      let tokens: string[];
      
      if (targetUserIds && targetUserIds.length > 0) {
        // Send to specific users
        tokens = await storage.getDeviceTokensByUserIds(targetUserIds);
      } else {
        // Send to all customers
        tokens = await storage.getDeviceTokensByRole('customer');
      }

      if (tokens.length === 0) {
        console.log('No device tokens found for promotional notification');
        return { successCount: 0, failureCount: 0 };
      }

      return await this.sendToMultipleDevices(tokens, payload, { priority: 'normal', sound: 'promotion' });
    } catch (error) {
      console.error('Error sending promotional notification:', error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Subscribe device token to topic
   */
  static async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`Successfully subscribed ${response.successCount} tokens to topic: ${topic}`);
      return response.successCount > 0;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  /**
   * Send notification to topic
   */
  static async sendToTopic(
    topic: string,
    payload: FirebaseNotificationPayload,
    options: FirebaseNotificationOptions = {}
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: options.priority || 'high',
          ttl: options.timeToLive || 3600000,
          notification: {
            sound: options.sound || 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: 'siraha_bazaar_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent topic message:', response);
      return true;
    } catch (error) {
      console.error('Error sending topic message:', error);
      return false;
    }
  }
}

// Initialize Firebase service
FirebaseService.initialize();

export default FirebaseService;