// Simple server test
console.log('🔍 Testing server startup...');

// Test if we can start a basic server
const express = require('express');
const path = require('path');

const app = express();
const port = 5001; // Use different port to avoid conflicts

// Serve static files
app.use(express.static(path.join(__dirname, 'client/public')));

// Basic API test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/public/index.html'));
});

app.listen(port, () => {
  console.log(`✅ Test server running on http://localhost:${port}`);
  console.log(`📝 Try opening: http://localhost:${port}/api/test`);
  console.log('🌐 If this works, the issue is with the main server configuration');
});