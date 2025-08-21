import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  description?: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  startsAt?: string;
  endsAt?: string;
}

interface BannerDisplayProps {
  position?: 'main' | 'sidebar' | 'footer';
  className?: string;
}

export default function BannerDisplay({ position = 'main', className = '' }: BannerDisplayProps) {
  const [dismissedBanners, setDismissedBanners] = useState<number[]>([]);

  // Fetch active banners
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: [`/api/banners/active`, position],
    queryFn: async () => {
      const response = await fetch(`/api/banners/active?position=${position}`);
      if (!response.ok) throw new Error('Failed to fetch banners');
      const bannerData = await response.json();
      
      // Trigger banner notifications when banners are fetched and displayed
      if (bannerData.length > 0) {
        bannerData.forEach((banner: Banner) => {
          // Dispatch custom event for banner display
          window.dispatchEvent(new CustomEvent('bannerDisplayed', {
            detail: {
              bannerId: banner.id,
              title: banner.title,
              message: banner.description || 'New banner available!'
            }
          }));
        });
      }
      
      return bannerData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter out dismissed banners
  const visibleBanners = banners.filter(banner => !dismissedBanners.includes(banner.id));

  // Handle banner dismissal
  const dismissBanner = (bannerId: number) => {
    setDismissedBanners(prev => [...prev, bannerId]);
    
    // Store dismissed banners in localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
    dismissed.push(bannerId);
    localStorage.setItem('dismissedBanners', JSON.stringify(dismissed));
  };

  // Load dismissed banners from localStorage on mount
  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
    setDismissedBanners(dismissed);
  }, []);

  // Listen for banner notifications
  useEffect(() => {
    const handleBannerNotification = (event: CustomEvent) => {
      const { bannerId, title, message } = event.detail;
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/icons/notification-icon.png',
          badge: '/icons/notification-badge.png'
        });
      }
      
      // Play notification sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => console.log('Could not play notification sound'));
      } catch (error) {
        console.log('Error playing notification sound:', error);
      }
    };

    window.addEventListener('bannerNotification', handleBannerNotification as EventListener);
    
    return () => {
      window.removeEventListener('bannerNotification', handleBannerNotification as EventListener);
    };
  }, []);

  if (isLoading || visibleBanners.length === 0) {
    return null;
  }

  return (
    <div className={`banner-display ${className}`}>
      {visibleBanners.map((banner) => (
        <BannerItem
          key={banner.id}
          banner={banner}
          onDismiss={() => dismissBanner(banner.id)}
        />
      ))}
    </div>
  );
}

interface BannerItemProps {
  banner: Banner;
  onDismiss: () => void;
}

function BannerItem({ banner, onDismiss }: BannerItemProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(), 300); // Wait for animation
  };

  const handleClick = () => {
    if (banner.linkUrl) {
      window.open(banner.linkUrl, '_blank');
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      relative overflow-hidden rounded-lg shadow-lg mb-4 
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      ${banner.linkUrl ? 'cursor-pointer hover:shadow-xl' : ''}
    `}>
      {/* Banner Image */}
      <div 
        className="relative w-full h-32 sm:h-40 md:h-48 bg-gradient-to-r from-blue-500 to-purple-600"
        onClick={handleClick}
      >
        {banner.imageUrl && (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 drop-shadow-lg">
              {banner.title}
            </h3>
            {banner.description && (
              <p className="text-sm sm:text-base opacity-90 drop-shadow">
                {banner.description}
              </p>
            )}
            {banner.linkUrl && (
              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  View Offer
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 text-white hover:bg-white/20 p-1 h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}