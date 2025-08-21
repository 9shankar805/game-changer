// Performance optimization utilities for Siraha Bazaar

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private observer: IntersectionObserver | null = null;
  private imageCache = new Map<string, HTMLImageElement>();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Lazy load images with intersection observer
  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              this.observer?.unobserve(img);
            }
          }
        });
      }, { rootMargin: '50px' });
    }
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      '/icon-192x192.png',
      '/sounds/notification.mp3',
      '/assets/icon2.png'
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = resource.endsWith('.mp3') ? 'audio' : 'image';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Optimize fonts
  optimizeFonts() {
    const fontLink = document.createElement('link');
    fontLink.rel = 'preconnect';
    fontLink.href = 'https://fonts.googleapis.com';
    document.head.appendChild(fontLink);

    const fontLink2 = document.createElement('link');
    fontLink2.rel = 'preconnect';
    fontLink2.href = 'https://fonts.gstatic.com';
    fontLink2.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink2);
  }

  // Image compression and format detection
  getOptimalImageFormat(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Check AVIF support
      if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
        return 'avif';
      }
      // Check WebP support
      if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
        return 'webp';
      }
    }
    return 'jpg';
  }

  // Debounce function for performance
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Throttle function for scroll events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Critical CSS injection
  injectCriticalCSS() {
    const criticalCSS = `
      .loading-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite; }
      @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      .fade-in { opacity: 0; animation: fadeIn 0.3s ease-in forwards; }
      @keyframes fadeIn { to { opacity: 1; } }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }

  // Resource hints
  addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
      { rel: 'preconnect', href: 'https://api.siraha-bazaar.com' }
    ];

    hints.forEach(({ rel, href }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    });
  }

  // Initialize all optimizations
  init() {
    this.initLazyLoading();
    this.preloadCriticalResources();
    this.optimizeFonts();
    this.injectCriticalCSS();
    this.addResourceHints();
    
    console.log('🚀 Performance optimizations initialized');
  }
}

// Auto-initialize
export const performanceOptimizer = PerformanceOptimizer.getInstance();