// Quick fix for white screen issue
console.log('🔧 Fixing white screen issue...');

// Force show the page immediately
document.documentElement.style.visibility = 'visible';
document.documentElement.style.opacity = '1';

// Add fallback in case React doesn't load
setTimeout(() => {
  const root = document.getElementById('root');
  if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
    root.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #059669; margin-bottom: 20px;">🚀 Siraha Bazaar</h1>
        <p style="color: #666; margin-bottom: 20px;">Loading application...</p>
        <div style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #059669; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <p style="color: #999; margin-top: 20px; font-size: 14px;">
          If this persists, check the browser console for errors.
        </p>
      </div>
    `;
  }
}, 3000);

console.log('✅ White screen fix applied');