import compression from 'compression';
import { Request, Response, NextFunction } from 'express';

// Advanced compression middleware with Brotli and Gzip
export const compressionMiddleware = compression({
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Compress all text-based responses
    return compression.filter(req, res);
  }
});

// Cache headers middleware
export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // Static assets - long cache
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif|woff|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // API responses - short cache
  else if (path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  // HTML - no cache for dynamic content
  else {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  
  next();
};

// Security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};