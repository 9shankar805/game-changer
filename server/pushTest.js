const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:test@example.com',
  'BG5V1u2eNls8IInm93_F-ZBb2hXaEZIy4AjHBrIjDeClqi4wLVlVZ5x64WeMzFESgByQjeOtcL1UrGMGFQm0GlE',
  'x-WP8TzbDsKjEC80-V6GA4CkglSbCEcIftxT8Vgi6pg'
);

// Test subscription (replace with real one from browser)
const testSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test',
  keys: {
    p256dh: 'test',
    auth: 'test'
  }
};

const payload = JSON.stringify({
  title: '🎉 Background Notification',
  body: 'This works even when browser is closed!'
});

webpush.sendNotification(testSubscription, payload)
  .then(() => console.log('Push sent!'))
  .catch(err => console.log('Error:', err));