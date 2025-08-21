import { createRoot } from "react-dom/client";
import App from "./App";
import TestApp from "./TestApp";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import "./utils/androidFCMHandler";
import { PWAService } from "./utils/pwa";
import { pwaManager } from "./lib/professionalPWA";
import { performanceOptimizer } from "./lib/performanceOptimizer";

// Handle unhandled promise rejections at the global level
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default error display
  event.preventDefault();
});

// Handle uncaught errors
window.addEventListener('error', (event) => {
  // Suppress WebSocket connection errors in development
  if (event.message && event.message.includes('WebSocket')) {
    return;
  }
  console.error('Uncaught error:', event.error);
});

try {
  console.log("Starting React app initialization...");
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  console.log("Root element found, creating React root...");
  
  // Show minimal loading while React initializes
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: Arial, sans-serif;">
      <div style="position: relative; width: 60px; height: 60px; margin-bottom: 20px;">
        <div style="position: absolute; inset: 0; border: 3px solid #f3f4f6; border-top: 3px solid #FF6B35; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <img src="/assets/icon2.png" alt="Siraha Bazaar" style="position: absolute; inset: 0; width: 35px; height: 35px; margin: auto; object-fit: contain;" />
      </div>
      <div style="color: #059669; font-size: 18px; font-weight: 600;">Siraha Bazaar</div>
      <div style="color: #666; margin-top: 10px; font-size: 14px;">Loading...</div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  const root = createRoot(rootElement);
  
  // Test if basic React rendering works
  const isTestMode = window.location.search.includes('test=true');
  
  console.log(`Rendering app in ${isTestMode ? 'test' : 'normal'} mode...`);
  
  root.render(
    <ErrorBoundary>
      {isTestMode ? <TestApp /> : <App />}
    </ErrorBoundary>
  );
  
  console.log("React app mounted successfully");
  
  // Signal that React is ready
  window.dispatchEvent(new Event('react-ready'));
  
  // Initialize PWA features
  PWAService.initialize().then(() => {
    console.log("PWA features initialized");
  }).catch((error) => {
    console.error("PWA initialization failed:", error);
  });
  
  // Initialize Professional PWA Manager
  console.log("🚀 Professional PWA Manager initialized:", pwaManager.getAppInfo());
  
  // Initialize Performance Optimizations
  performanceOptimizer.init();
} catch (error: any) {
  console.error("Failed to mount React app:", error);
  const errorMessage = error?.message || String(error);
  
  // Show error with logo
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; font-family: Arial, sans-serif;">
      <img src="/assets/icon2.png" alt="Siraha Bazaar" style="width: 80px; height: 80px; margin-bottom: 20px; object-fit: contain;" />
      <h2 style="color: #059669; margin-bottom: 10px;">Siraha Bazaar</h2>
      <p style="color: #666; margin-bottom: 20px;">Something went wrong</p>
      <div style="background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; max-width: 500px; margin-bottom: 20px;">
        <p style="color: #c33; font-size: 14px; margin: 0;">${errorMessage}</p>
      </div>
      <button onclick="window.location.reload()" style="background: #059669; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Reload Page</button>
    </div>
  `;
}
