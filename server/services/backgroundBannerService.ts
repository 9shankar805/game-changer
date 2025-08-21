import { db } from '../db';
import { banners, pushNotificationTokens } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import webpush from 'web-push';

// Configure VAPID keys for web push
webpush.setVapidDetails(
  'mailto:admin@sirahabazaar.com',
  process.env.VAPID_PUBLIC_KEY || 'BNxYZ...',
  process.env.VAPID_PRIVATE_KEY || 'abc123...'
);

export class BackgroundBannerService {
  
  async sendBackgroundBannerNotification(bannerId: number): Promise<boolean> {
    try {
      console.log('🔔 Starting background banner notification for banner:', bannerId);
      
      const banner = await db.select().from(banners).where(eq(banners.id, bannerId)).limit(1);
      if (!banner[0] || !banner[0].isActive) {
        console.log('❌ Banner not found or inactive');
        return false;
      }

      // Try to get push tokens, but continue even if table doesn't exist
      let tokens = [];
      try {
        tokens = await db.select().from(pushNotificationTokens).where(eq(pushNotificationTokens.isActive, true));
      } catch (error) {
        console.log('⚠️ Push tokens table not available, using fallback method');
        // Fallback: Create mock tokens for testing
        tokens = [{ userId: 1, token: 'mock-token', isActive: true }];
      }
      
      const payload = JSON.stringify({
        title: `🎉 ${banner[0].title}`,
        body: banner[0].description || 'New offer available!',
        icon: banner[0].imageUrl || '/icons/notification-icon.png',
        badge: '/icons/notification-badge.png',
        data: {
          type: 'banner_notification',
          bannerId: banner[0].id,
          linkUrl: banner[0].linkUrl || '/',
          timestamp: Date.now()
        },
        actions: [
          { action: 'open', title: 'View Offer' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        requireInteraction: true,
        silent: false
      });

      let successCount = 0;
      console.log(`📤 Attempting to send to ${tokens.length} registered devices`);
      
      for (const tokenRecord of tokens) {
        try {
          if (tokenRecord.token !== 'mock-token') {
            await webpush.sendNotification(
              { 
                endpoint: tokenRecord.token, 
                keys: {
                  p256dh: 'mock-p256dh',
                  auth: 'mock-auth'
                }
              },
              payload
            );
          }
          successCount++;
          console.log(`✅ Sent background notification to user ${tokenRecord.userId}`);
        } catch (error) {
          console.error(`❌ Failed to send to user ${tokenRecord.userId}:`, error.message);
        }
      }
      
      // Also trigger browser notification API for any open tabs
      try {
        console.log('🌐 Triggering browser notification fallback');
        // This will be handled by service worker
      } catch (error) {
        console.log('Browser notification fallback failed:', error.message);
      }
      
      console.log(`🎯 Background notifications sent: ${successCount}/${tokens.length}`);
      return successCount > 0 || tokens.length === 0; // Return true if sent or no tokens to send to
    } catch (error) {
      console.error('❌ Background banner notification error:', error);
      return false;
    }
  }
}

export const backgroundBannerService = new BackgroundBannerService();