# Web Push Notifications Setup Guide

## 1. Generate VAPID Keys

First, you need to generate VAPID keys for web push notifications:

```bash
# Install web-push globally if not already installed
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

This will output something like:
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
VCxaZ7zG2nfu7O5F3YBT1WJ2R6sIgDUAzqe8ZtdLcGc
=======================================
```

## 2. Environment Variables

Add these to your `.env` file:

```env
# VAPID Keys for Web Push Notifications
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
VAPID_PRIVATE_KEY=VCxaZ7zG2nfu7O5F3YBT1WJ2R6sIgDUAzqe8ZtdLcGc
```

**Important:** Replace the example keys above with your actual generated keys.

## 3. Install Dependencies

```bash
npm install web-push
```

## 4. Usage Examples

### Initialize Push Notifications (Frontend)

```javascript
import { initPushNotifications, showBannerAndPush } from './lib/pushNotifications';

// Initialize when app starts
initPushNotifications();

// Show both banner and push notification
showBannerAndPush({
  title: 'New Order!',
  body: 'You have received a new order #12345'
});
```

### Backend Integration

The backend endpoints are already set up:
- `POST /api/push/subscribe` - Save user's push subscription
- `POST /api/push/send` - Send push notifications

### Test the Implementation

1. Open your website in a browser
2. Allow notifications when prompted
3. Use the test component or call `showBannerAndPush()` directly
4. You should see both:
   - A banner notification inside the website
   - A browser push notification (even when the site is closed)

## 5. File Structure

```
├── public/
│   └── sw.js                           # Service worker for push events
├── client/src/
│   ├── lib/
│   │   └── pushNotifications.js        # Frontend push notification logic
│   └── components/
│       └── BannerNotifications.tsx     # Example React component
└── server/
    ├── webPushService.ts              # Backend web push service
    └── routes.ts                      # API endpoints (already updated)
```

## 6. Security Notes

- Keep your VAPID private key secure and never expose it in frontend code
- The public key can be safely used in frontend code
- VAPID keys should be different for development and production environments

## 7. Browser Support

Web Push Notifications are supported in:
- Chrome 42+
- Firefox 44+
- Safari 16+ (macOS 13+, iOS 16.4+)
- Edge 17+

## 8. Troubleshooting

- **No notifications appearing**: Check if notifications are enabled in browser settings
- **VAPID errors**: Ensure keys are correctly set in environment variables
- **Service worker issues**: Check browser console for service worker registration errors
- **HTTPS required**: Push notifications only work on HTTPS (or localhost for development)