import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  priority = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate responsive image sources
  const generateSrcSet = (baseSrc: string) => {
    const ext = baseSrc.split('.').pop();
    const base = baseSrc.replace(`.${ext}`, '');
    
    return {
      webp: `${base}.webp`,
      avif: `${base}.avif`,
      original: baseSrc
    };
  };

  const sources = generateSrcSet(src);

  useEffect(() => {
    if (priority && imgRef.current) {
      // Preload critical images
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  }, [src, priority]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !error && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      <picture>
        <source srcSet={sources.avif} type="image/avif" />
        <source srcSet={sources.webp} type="image/webp" />
        <img
          ref={imgRef}
          src={sources.original}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
        />
      </picture>
      
      {error && (
        <div 
          className="flex items-center justify-center bg-gray-100 text-gray-400"
          style={{ width, height }}
        >
          <span>Image failed to load</span>
        </div>
      )}
    </div>
  );
}