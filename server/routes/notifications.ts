import { Request, Response } from 'express';
import UnifiedNotificationService from '../unifiedNotificationService';

// Register FCM token
export async function registerFCMToken(req: Request, res: Response) {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({ error: 'Missing userId or token' });
    }

    await UnifiedNotificationService.registerFCMToken(userId, token);
    
    // Send test notification
    await UnifiedNotificationService.sendTestNotification(userId);
    
    res.json({ success: true, message: 'FCM token registered' });
  } catch (error) {
    console.error('FCM token registration error:', error);
    res.status(500).json({ error: 'Failed to register FCM token' });
  }
}

// Register web-push subscription
export async function registerWebPush(req: Request, res: Response) {
  try {
    const { userId, subscription } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({ error: 'Missing userId or subscription' });
    }

    await UnifiedNotificationService.registerWebPush(userId, subscription);
    
    res.json({ success: true, message: 'Web-push subscription registered' });
  } catch (error) {
    console.error('Web-push registration error:', error);
    res.status(500).json({ error: 'Failed to register web-push subscription' });
  }
}

// Send test notification
export async function sendTestNotification(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const sent = await UnifiedNotificationService.sendTestNotification(userId);
    
    res.json({ 
      success: sent, 
      message: sent ? 'Test notification sent' : 'Failed to send notification' 
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
}

// Get notification stats
export async function getNotificationStats(req: Request, res: Response) {
  try {
    const stats = UnifiedNotificationService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}