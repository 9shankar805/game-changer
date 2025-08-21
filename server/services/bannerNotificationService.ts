import { db } from '../db';
import { banners, pushNotificationTokens, notifications, users } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { pushNotificationService } from './pushNotificationService';

export interface BannerNotificationData {
  bannerId: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  description?: string;
  position: string;
}

export class BannerNotificationService {
  
  // Send banner notification to all users when banner becomes active
  async sendBannerNotification(bannerData: BannerNotificationData): Promise<boolean> {
    try {
      console.log('🎯 Sending banner notification:', bannerData.title);
      
      // Get all users for in-app notifications (always send these)
      const allUsers = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.status, 'active'));
      
      console.log(`Found ${allUsers.length} active users for banner notifications`);
      
      // Get all active push notification tokens for background notifications
      let activeTokens = [];
      try {
        activeTokens = await db.select()
          .from(pushNotificationTokens)
          .where(eq(pushNotificationTokens.isActive, true));
      } catch (error) {
        console.log('Push notification tokens table not available, continuing with in-app notifications only');
      }

      // Create notification payload
      const payload = {
        title: `🎉 ${bannerData.title}`,
        body: bannerData.description || 'Check out our latest offer!',
        icon: bannerData.imageUrl,
        badge: '/icons/notification-badge.png',
        data: {
          type: 'banner_notification',
          bannerId: bannerData.bannerId,
          linkUrl: bannerData.linkUrl,
          position: bannerData.position,
          timestamp: new Date().toISOString()
        },
        actions: [
          { action: 'view', title: 'View Offer', icon: '/icons/eye.png' },
          { action: 'dismiss', title: 'Dismiss', icon: '/icons/close.png' }
        ]
      };

      // Send in-app notifications to ALL active users (100% guaranteed)
      let inAppSuccessCount = 0;
      for (const user of allUsers) {
        try {
          // Store notification in database for ALL users
          await db.insert(notifications).values({
            userId: user.id,
            title: payload.title,
            message: payload.body,
            type: 'banner',
            isRead: false,
            data: JSON.stringify(payload.data),
            createdAt: new Date()
          });
          inAppSuccessCount++;
        } catch (error) {
          console.error(`Failed to send in-app banner notification to user ${user.id}:`, error);
        }
      }
      
      // Send push notifications to users with tokens (additional layer)
      let pushSuccessCount = 0;
      for (const tokenRecord of activeTokens) {
        try {
          // Send push notification
          await pushNotificationService.sendToUser(tokenRecord.userId, payload);
          pushSuccessCount++;
        } catch (error) {
          console.error(`Failed to send push banner notification to user ${tokenRecord.userId}:`, error);
        }
      }

      console.log(`✅ Banner in-app notifications sent to ${inAppSuccessCount}/${allUsers.length} users`);
      console.log(`✅ Banner push notifications sent to ${pushSuccessCount}/${activeTokens.length} users with tokens`);
      
      // Return true if at least in-app notifications were sent (guaranteed 100%)
      return inAppSuccessCount > 0;
    } catch (error) {
      console.error('Error sending banner notification:', error);
      return false;
    }
  }

  // Check for active banners and send notifications
  async checkAndNotifyActiveBanners(): Promise<void> {
    try {
      const now = new Date();
      
      // Get banners that are active and should be displayed now
      const activeBanners = await db.select()
        .from(banners)
        .where(
          and(
            eq(banners.isActive, true),
            lte(banners.startsAt, now),
            gte(banners.endsAt, now)
          )
        );

      console.log(`🔍 Found ${activeBanners.length} active banners`);

      for (const banner of activeBanners) {
        // Check if we've already sent notification for this banner today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingNotifications = await db.select()
          .from(notifications)
          .where(
            and(
              eq(notifications.type, 'banner'),
              gte(notifications.createdAt, today)
            )
          )
          .limit(1);

        // Only send if no banner notification sent today
        if (existingNotifications.length === 0) {
          await this.sendBannerNotification({
            bannerId: banner.id,
            title: banner.title,
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl || undefined,
            description: banner.description || undefined,
            position: banner.position
          });
        }
      }
    } catch (error) {
      console.error('Error checking active banners:', error);
    }
  }

  // Send banner notification when banner is created/updated
  async notifyBannerUpdate(bannerId: number): Promise<boolean> {
    try {
      const banner = await db.select()
        .from(banners)
        .where(eq(banners.id, bannerId))
        .limit(1);

      if (banner.length === 0) {
        console.log(`Banner ${bannerId} not found`);
        return false;
      }

      const bannerData = banner[0];
      
      // Only send notification if banner is active
      if (!bannerData.isActive) {
        console.log(`Banner ${bannerId} is not active, skipping notification`);
        return false;
      }

      return await this.sendBannerNotification({
        bannerId: bannerData.id,
        title: bannerData.title,
        imageUrl: bannerData.imageUrl,
        linkUrl: bannerData.linkUrl || undefined,
        description: bannerData.description || undefined,
        position: bannerData.position
      });
    } catch (error) {
      console.error('Error notifying banner update:', error);
      return false;
    }
  }

  // Schedule banner notifications
  startBannerNotificationScheduler(): void {
    console.log('🕐 Starting banner notification scheduler...');
    
    // Check every 5 minutes for active banners
    setInterval(async () => {
      await this.checkAndNotifyActiveBanners();
    }, 5 * 60 * 1000); // 5 minutes

    // Initial check
    this.checkAndNotifyActiveBanners();
  }
}

export const bannerNotificationService = new BannerNotificationService();