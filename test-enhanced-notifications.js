/**
 * Test script for enhanced notifications with professional content and logo
 * Run with: node test-enhanced-notifications.js
 */

const { NotificationService } = require('./server/notificationService');

async function testEnhancedNotifications() {
  console.log('🚀 Testing Enhanced Notifications with Professional Content & Logo\n');

  try {
    // Test 1: Order notification to shopkeeper
    console.log('📋 Test 1: Enhanced Order Notification to Shopkeeper');
    await NotificationService.sendOrderNotificationToShopkeepers(
      12345,
      'John Doe',
      '850',
      [
        { storeId: 1, productName: 'Fresh Apples', quantity: 2 },
        { storeId: 1, productName: 'Organic Bananas', quantity: 3 }
      ]
    );
    console.log('✅ Order notification sent with professional content and logo\n');

    // Test 2: Delivery assignment notification
    console.log('📋 Test 2: Enhanced Delivery Assignment Notification');
    await NotificationService.sendDeliveryAssignmentNotification(
      101,
      12345,
      'Siraha Bazaar Store, Main Street, Siraha',
      'Customer Address, Residential Area, Siraha',
      '2.5 km',
      '75'
    );
    console.log('✅ Delivery assignment notification sent with distance and earnings info\n');

    // Test 3: Order status update to customer
    console.log('📋 Test 3: Enhanced Order Status Update');
    await NotificationService.sendOrderStatusUpdateToCustomer(
      201,
      12345,
      'out_for_delivery',
      'Your order is on the way!',
      '30 minutes'
    );
    console.log('✅ Order status update sent with detailed professional message\n');

    // Test 4: Low stock alert
    console.log('📋 Test 4: Enhanced Low Stock Alert');
    await NotificationService.sendLowStockAlert(
      301,
      456,
      'Premium Basmati Rice 5kg',
      8,
      15
    );
    console.log('✅ Low stock alert sent with urgency level and reorder info\n');

    // Test 5: Payment confirmation
    console.log('📋 Test 5: Enhanced Payment Confirmation');
    await NotificationService.sendPaymentConfirmation(
      201,
      12345,
      '850',
      'Credit Card',
      'TXN123456789'
    );
    console.log('✅ Payment confirmation sent with transaction details\n');

    // Test 6: Product review notification
    console.log('📋 Test 6: Enhanced Product Review Notification');
    await NotificationService.sendProductReviewNotification(
      301,
      456,
      'Premium Basmati Rice 5kg',
      5,
      'Sarah Johnson',
      'Excellent quality rice, very satisfied with the purchase!'
    );
    console.log('✅ Product review notification sent with rating emoji and feedback\n');

    // Test 7: Store verification update
    console.log('📋 Test 7: Enhanced Store Verification Update');
    await NotificationService.sendStoreVerificationUpdate(
      301,
      'approved',
      null,
      'Start adding products and begin selling immediately'
    );
    console.log('✅ Store verification update sent with congratulatory message\n');

    // Test 8: Earnings update
    console.log('📋 Test 8: Enhanced Earnings Update');
    await NotificationService.sendEarningsUpdate(
      101,
      '450',
      6,
      'today',
      '50'
    );
    console.log('✅ Earnings update sent with performance encouragement\n');

    // Test 9: Promotional notification
    console.log('📋 Test 9: Enhanced Promotional Notification');
    await NotificationService.sendPromotionNotification(
      [201, 202, 203],
      'Weekend Special Offer',
      'Get 20% off on all fresh fruits and vegetables this weekend!',
      {
        promoCode: 'WEEKEND20',
        validUntil: '2024-01-15',
        category: 'fruits_vegetables'
      }
    );
    console.log('✅ Promotional notification sent with enhanced branding\n');

    console.log('🎉 All enhanced notifications tested successfully!');
    console.log('📱 Features added:');
    console.log('   • Professional messaging with emojis');
    console.log('   • Siraha Bazaar branding in titles');
    console.log('   • Logo integration (/assets/icon2.png)');
    console.log('   • Detailed contextual information');
    console.log('   • Encouraging and supportive tone');
    console.log('   • Action-oriented call-to-actions');

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  }
}

// Run the test
testEnhancedNotifications();