import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { runSimpleMigrations } from "./simple-migrate";
import { pool } from "./db";
import { compressionMiddleware, cacheMiddleware, securityHeaders } from "./middleware/compression";

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const app = express();

// Performance optimizations
app.use(compressionMiddleware);
app.use(cacheMiddleware);
app.use(securityHeaders);
app.set('trust proxy', 1);

// Additional security headers for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
}

// Add CORS configuration for production domain
import cors from 'cors';
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.ALLOWED_ORIGINS || 'https://yourdomain.com').split(',')
  : [
      'http://localhost:5173',
      'http://localhost:5000',
      'http://localhost:3000',
      /\.replit\.dev$/,
      /\.replit\.app$/
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Database health check and migrations with retry logic
async function initializeDatabase(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Database initialization attempt ${attempt}/${retries}`);
      
      // Test connection first
      const testResult = await pool.query('SELECT NOW()');
      console.log('✅ Database connection test successful');
      
      // Run migrations
      await runSimpleMigrations();
      console.log('✅ Database migrations completed successfully');
      return true;
    } catch (error) {
      console.error(`❌ Database initialization attempt ${attempt} failed:`, error);
      
      if (attempt < retries) {
        const delay = attempt * 2000; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All database initialization attempts failed');
        // Continue anyway to allow server to start
      }
    }
  }
  return false;
}

// Initialize database
initializeDatabase();

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
    try {
      console.log("Initializing database and creating default admin...");

      // Initialize database with default admin account
      await storage.createDefaultAdmin();
      console.log("✅ Database initialization completed");
    } catch (error) {
      console.error("❌ Error initializing database:", error);
      console.error("Stack:", error instanceof Error ? error.stack : 'No stack trace');
      // Continue anyway to allow the server to start
    }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite for development or serve static files for production
  const isDevelopment = process.env.NODE_ENV !== "production" || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    console.log('🔧 Setting up Vite development server...');
    await setupVite(app, server);
  } else {
    console.log('📦 Serving static production files...');
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Try to listen on port with error handling
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, shutting down gracefully...`);
      // Graceful shutdown
      process.exit(0);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
})();