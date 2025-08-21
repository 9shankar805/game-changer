# Banner Notification System

This system synchronizes banner display on the website with push notifications to all users. When a banner is created or activated, all users receive a push notification about the new offer/announcement.

## Features

✅ **Synchronized Display**: Banners appear on website and push notifications simultaneously  
✅ **Real-time Notifications**: Instant push notifications when banners go live  
✅ **Smart Scheduling**: Automatic banner activation based on start/end dates  
✅ **Position-based Display**: Banners can be positioned in main, sidebar, or footer areas  
✅ **Admin Management**: Full CRUD operations for banner management  
✅ **Manual Triggers**: Admins can manually send notifications for existing banners  

## How It Works

### 1. Banner Creation
When an admin creates a new banner:
- Banner is stored in the database
- If `isActive: true`, push notifications are sent to all users immediately
- Notifications include banner title, description, and link

### 2. Automatic Scheduling
The system checks every 5 minutes for:
- Banners that should become active (based on `startsAt` time)
- Banners that should expire (based on `endsAt` time)
- Sends notifications when banners become active

### 3. Website Display
- `BannerDisplay` component fetches active banners every 30 seconds
- Displays banners based on position (main, sidebar, footer)
- Users can dismiss banners (stored in localStorage)

## Usage

### For Admins

1. **Access Banner Management**
   ```
   Navigate to Admin Panel → Banner Management
   ```

2. **Create New Banner**
   - Click "Create Banner"
   - Fill in title, image URL, description
   - Set position (main/sidebar/footer)
   - Optional: Set start/end dates for scheduling
   - Toggle "Active" to enable notifications

3. **Manual Notification**
   - Click the "Send" icon on any active banner
   - Sends push notification to all users immediately

### For Developers

1. **Test Banner Creation**
   ```bash
   node create-test-banner.js
   ```

2. **Banner Display Component**
   ```jsx
   import BannerDisplay from '@/components/BannerDisplay';
   
   // In your component
   <BannerDisplay position="main" className="my-4" />
   ```

3. **API Endpoints**
   ```
   GET  /api/banners/active?position=main  # Get active banners
   POST /api/admin/banners                 # Create banner (sends notification)
   PUT  /api/admin/banners/:id             # Update banner (sends notification)
   POST /api/admin/banners/:id/notify      # Manual notification trigger
   ```

## Configuration

### Banner Schema
```typescript
interface Banner {
  id: number;
  title: string;           // Notification title
  imageUrl: string;        // Banner image
  linkUrl?: string;        // Click destination
  description?: string;    // Notification body
  position: string;        // 'main' | 'sidebar' | 'footer'
  isActive: boolean;       // Triggers notifications when true
  displayOrder: number;    // Display priority
  startsAt?: Date;         // Auto-activation time
  endsAt?: Date;          // Auto-expiration time
}
```

### Notification Payload
```typescript
{
  title: "🎉 Flash Sale - 50% Off Everything!",
  body: "Limited time offer! Get 50% off on all products.",
  icon: "banner-image-url",
  data: {
    type: "banner_notification",
    bannerId: 1,
    linkUrl: "/flash-sales",
    position: "main"
  }
}
```

## Service Architecture

### Backend Services
- `BannerNotificationService`: Handles notification logic
- `PushNotificationService`: Manages push notification delivery
- Scheduler: Checks for active banners every 5 minutes

### Frontend Components
- `BannerDisplay`: Shows banners on website
- `BannerManagement`: Admin interface for banner CRUD
- Service Worker: Handles push notification display

## Testing

1. **Create Test Banner**
   ```bash
   node create-test-banner.js
   ```

2. **Verify Notification**
   - Check browser notifications
   - Verify banner appears on homepage
   - Test banner dismissal

3. **Admin Testing**
   - Access `/admin` panel
   - Create/edit banners
   - Test manual notification triggers

## Troubleshooting

### No Notifications Received
- Check if user has granted notification permissions
- Verify push notification tokens are registered
- Check browser console for service worker errors

### Banners Not Displaying
- Verify banner `isActive: true`
- Check `startsAt`/`endsAt` dates
- Ensure correct position parameter

### Service Worker Issues
- Clear browser cache and reload
- Check `/firebase-messaging-sw.js` is accessible
- Verify Firebase configuration

## Best Practices

1. **Banner Content**
   - Keep titles under 50 characters
   - Use compelling descriptions
   - Include clear call-to-action

2. **Timing**
   - Schedule banners during peak hours
   - Avoid notification spam (max 1-2 per day)
   - Set appropriate expiration dates

3. **Images**
   - Use high-quality images (800x400px recommended)
   - Optimize for fast loading
   - Ensure mobile responsiveness

## Integration Examples

### Homepage Integration
```jsx
export default function Homepage() {
  return (
    <div>
      {/* Hero Section */}
      <HeroSlider />
      
      {/* Banner Display - Synchronized with notifications */}
      <BannerDisplay position="main" className="container mx-auto py-4" />
      
      {/* Rest of homepage */}
      <Categories />
      <FeaturedProducts />
    </div>
  );
}
```

### Admin Panel Integration
```jsx
import BannerManagement from '@/components/admin/BannerManagement';

export default function AdminPanel() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <BannerManagement />
    </div>
  );
}
```

This system ensures that whenever a banner appears on your website, all users are notified simultaneously through push notifications, creating a unified and engaging user experience.