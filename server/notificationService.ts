import { storage } from './storage';

export interface NotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  orderId?: number;
  productId?: number;
  data?: any;
}

import FirebaseService from "./firebaseService";

export class NotificationService {
  // Send notification to specific user
  static async sendNotification(notificationData: NotificationData) {
    try {
      const notification = await storage.createNotification({
        ...notificationData,
        isRead: false
      });

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send order notifications to shopkeepers
  static async sendOrderNotificationToShopkeepers(orderId: number, customerName: string, totalAmount: string, orderItems: any[]) {
    const storeOwners = new Set<number>();
    
    // Get unique store owners from order items
    for (const item of orderItems) {
      const store = await storage.getStore(item.storeId);
      if (store) {
        storeOwners.add(store.ownerId);
      }
    }

    // Send notifications to each store owner
    for (const ownerId of Array.from(storeOwners)) {
      const itemCount = orderItems.filter(item => {
        return orderItems.some(oi => oi.storeId === item.storeId);
      }).length;
      
      await this.sendNotification({
        userId: ownerId,
        type: 'order',
        title: '🛍️ New Order Alert - Siraha Bazaar',
        message: `Congratulations! You've received a new order from ${customerName}. Order value: ₹${totalAmount} (${itemCount} items). Please prepare the items for pickup. Thank you for being a valued partner!`,
        orderId,
        data: {
          customerName,
          totalAmount,
          itemCount,
          icon: '/assets/icon2.png',
          badge: '/assets/icon2.png',
          orderItems: orderItems.filter(item => {
            return orderItems.some(oi => oi.storeId === item.storeId);
          })
        }
      });
    }
  }

  // Send delivery assignment notification to delivery partner
  static async sendDeliveryAssignmentNotification(deliveryPartnerId: number, orderId: number, pickupAddress: string, deliveryAddress: string, estimatedDistance?: string, estimatedEarnings?: string) {
    await this.sendNotification({
      userId: deliveryPartnerId,
      type: 'delivery',
      title: '🚚 New Delivery Opportunity - Siraha Bazaar',
      message: `Great news! A new delivery assignment is available. Pickup: ${pickupAddress.substring(0, 30)}... → Delivery: ${deliveryAddress.substring(0, 30)}...${estimatedDistance ? ` Distance: ${estimatedDistance}` : ''}${estimatedEarnings ? ` | Earnings: ₹${estimatedEarnings}` : ''}. Accept now to start earning!`,
      orderId,
      data: {
        pickupAddress,
        deliveryAddress,
        estimatedDistance,
        estimatedEarnings,
        icon: '/assets/icon2.png',
        badge: '/assets/icon2.png'
      }
    });
  }

  // Send order status update to customer
  static async sendOrderStatusUpdateToCustomer(customerId: number, orderId: number, status: string, description?: string, estimatedDelivery?: string) {
    const statusMessages: { [key: string]: { title: string, message: string } } = {
      'processing': {
        title: '⏳ Order Being Prepared - Siraha Bazaar',
        message: `Good news! Your order #${orderId} is now being carefully prepared by our store partners. We'll notify you once it's ready for pickup. Thank you for choosing Siraha Bazaar!`
      },
      'shipped': {
        title: '📦 Order Shipped - Siraha Bazaar', 
        message: `Exciting update! Your order #${orderId} has been shipped and is on its way to you.${estimatedDelivery ? ` Expected delivery: ${estimatedDelivery}.` : ''} Track your order for real-time updates!`
      },
      'out_for_delivery': {
        title: '🚛 Out for Delivery - Siraha Bazaar',
        message: `Your order #${orderId} is out for delivery! Our delivery partner is on the way to your location. Please keep your phone handy for any delivery updates. Thank you for your patience!`
      },
      'delivered': {
        title: '✅ Order Delivered Successfully - Siraha Bazaar',
        message: `Congratulations! Your order #${orderId} has been successfully delivered. We hope you love your purchase! Please rate your experience and share feedback to help us serve you better.`
      },
      'cancelled': {
        title: '❌ Order Cancelled - Siraha Bazaar',
        message: `We're sorry to inform you that your order #${orderId} has been cancelled. If you have any questions or need assistance with a new order, our customer support team is here to help. Thank you for understanding.`
      }
    };

    const statusInfo = statusMessages[status] || {
      title: '📋 Order Update - Siraha Bazaar',
      message: `Your order #${orderId} status has been updated to: ${status}. ${description || 'Please check your order details for more information.'}`
    };

    await this.sendNotification({
      userId: customerId,
      type: 'order',
      title: statusInfo.title,
      message: statusInfo.message,
      orderId,
      data: {
        status,
        description,
        estimatedDelivery,
        icon: '/assets/icon2.png',
        badge: '/assets/icon2.png'
      }
    });
  }

  // Send product low stock alert to shopkeeper
  static async sendLowStockAlert(storeOwnerId: number, productId: number, productName: string, currentStock: number, reorderLevel?: number) {
    const urgencyLevel = currentStock <= 5 ? '🚨 URGENT' : currentStock <= 10 ? '⚠️ WARNING' : '📊 NOTICE';
    
    await this.sendNotification({
      userId: storeOwnerId,
      type: 'product',
      title: `${urgencyLevel} Low Stock Alert - Siraha Bazaar`,
      message: `Attention! Your product "${productName}" is running low on inventory. Current stock: ${currentStock} units${reorderLevel ? ` (Reorder level: ${reorderLevel})` : ''}. Please restock soon to avoid missing sales opportunities. Update your inventory in the store dashboard.`,
      productId,
      data: {
        productName,
        currentStock,
        reorderLevel,
        urgencyLevel,
        icon: '/assets/icon2.png',
        badge: '/assets/icon2.png'
      }
    });
  }

  // Send payment confirmation to customer
  static async sendPaymentConfirmation(customerId: number, orderId: number, amount: string, paymentMethod: string, transactionId?: string) {
    await this.sendNotification({
      userId: customerId,
      type: 'payment',
      title: '💳 Payment Successful - Siraha Bazaar',
      message: `Great! Your payment of ₹${amount} has been successfully processed via ${paymentMethod} for order #${orderId}.${transactionId ? ` Transaction ID: ${transactionId}.` : ''} Your order is now confirmed and will be processed shortly. Thank you for shopping with Siraha Bazaar!`,
      orderId,
      data: {
        amount,
        paymentMethod,
        transactionId,
        icon: '/assets/icon2.png',
        badge: '/assets/icon2.png'
      }
    });
  }

  // Send new product review notification to shopkeeper
  static async sendProductReviewNotification(storeOwnerId: number, productId: number, productName: string, rating: number, customerName: string, reviewText?: string) {
    const ratingEmoji = rating >= 4 ? '⭐' : rating >= 3 ? '👍' : '📝';
    const ratingText = rating >= 4 ? 'Excellent' : rating >= 3 ? 'Good' : 'Needs Attention';
    
    await this.sendNotification({
      userId: storeOwnerId,
      type: 'product',
      title: `${ratingEmoji} New ${ratingText} Review - Siraha Bazaar`,
      message: `${customerName} has left a ${rating}-star review for "${productName}". ${rating >= 4 ? 'Congratulations on the positive feedback!' : rating >= 3 ? 'Keep up the good work!' : 'Consider reviewing this product to improve customer satisfaction.'}${reviewText ? ` Review: "${reviewText.substring(0, 50)}..."` : ''} Check your dashboard for full details.`,
      productId,
      data: {
        productName,
        rating,
        customerName,
        reviewText,
        ratingText,
        icon: '/assets/icon2.png',
        badge: '/assets/icon2.png'
      }
    });
  }

  // Send store verification update to shopkeeper
  static async sendStoreVerificationUpdate(storeOwnerId: number, status: string, reason?: string, nextSteps?: string) {
    const messages: { [key: string]: { title: string, message: string } } = {
      'approved': {
        title: '🎉 Store Approved - Welcome to Siraha Bazaar!',
        message: 'Congratulations! Your store has been successfully approved and is now live on Siraha Bazaar. You can start adding products and receiving orders immediately. Welcome to our growing community of trusted sellers!'
      },
      'rejected': {
        title: '❌ Store Application Update - Siraha Bazaar',
        message: `We regret to inform you that your store application requires attention. Reason: ${reason || 'Please review the requirements and contact our support team for guidance.'}${nextSteps ? ` Next steps: ${nextSteps}` : ' You can resubmit your application after addressing the issues.'}`
      },
      'under_review': {
        title: '🔍 Store Under Review - Siraha Bazaar',
        message: 'Thank you for submitting your store application! Our team is currently reviewing your store details and documentation. This process typically takes 24-48 hours. We\'ll notify you once the review is complete.'
      },
      'pending_documents': {
        title: '📄 Documents Required - Siraha Bazaar',
        message: `Your store application is almost complete! We need some additional documents to proceed with verification. ${reason || 'Please check your dashboard for the list of required documents.'} Upload them at your earliest convenience.`
      }
    };

    const statusInfo = messages[status] || {
      title: '📋 Store Status Update - Siraha Bazaar',
      message: `Your store verification status has been updated to: ${status}. ${reason || 'Please check your store dashboard for more details.'}`
    };

    await this.sendNotification({
      userId: storeOwnerId,
      type: 'store',
      title: statusInfo.title,
      message: statusInfo.message,
      data: {
        status,
        reason,
        nextSteps,
        icon: '/assets/icon2.png',
        badge: '/assets/icon2.png'
      }
    });
  }

  // Send delivery partner earnings update
  static async sendEarningsUpdate(deliveryPartnerId: number, amount: string, deliveryCount: number, period: string = 'today', bonusAmount?: string) {
    const periodEmoji = period === 'today' ? '📅' : period === 'week' ? '📊' : '💰';
    
    await this.sendNotification({
      userId: deliveryPartnerId,
      type: 'delivery',
      title: `${periodEmoji} Earnings Summary - Siraha Bazaar`,
      message: `Excellent work! You've earned ₹${amount} from ${deliveryCount} successful deliveries ${period}.${bonusAmount ? ` Bonus earnings: ₹${bonusAmount}!` : ''} ${deliveryCount >= 10 ? 'Outstanding performance!' : deliveryCount >= 5 ? 'Great job!' : 'Keep up the good work!'} Thank you for being a valuable delivery partner.`,
      data: {
        amount,
        deliveryCount,
        period,
        bonusAmount,
        icon: '/assets/icon2.png',
        badge: '/assets/icon2.png'
      }
    });
  }

  // Send promotion notification to customers
  static async sendPromotionNotification(customerIds: number[], title: string, message: string, promotionData?: any) {
    const enhancedTitle = title.includes('Siraha Bazaar') ? title : `${title} - Siraha Bazaar`;
    const enhancedMessage = `${message} Don't miss out on this amazing opportunity! Shop now and save more with Siraha Bazaar.`;
    
    const notifications = customerIds.map(customerId => 
      this.sendNotification({
        userId: customerId,
        type: 'promotion',
        title: `🎁 ${enhancedTitle}`,
        message: enhancedMessage,
        data: {
          ...promotionData,
          icon: '/assets/icon2.png',
          badge: '/assets/icon2.png'
        }
      })
    );

    await Promise.all(notifications);
  }

  // Send system notification to all users of a specific role
  static async sendSystemNotificationByRole(role: string, title: string, message: string) {
    try {
      // Get all users with the specified role
      const users = await storage.getAllUsersWithStatus();
      const roleUsers = users.filter(user => user.role === role);

      const notifications = roleUsers.map(user => 
        this.sendNotification({
          userId: user.id,
          type: 'system',
          title,
          message
        })
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Failed to send system notification by role:', error);
    }
  }
}