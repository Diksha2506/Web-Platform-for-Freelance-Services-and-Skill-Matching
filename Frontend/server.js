const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('login page'));

// Serve login page as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login page', 'login.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ message: '✅ Frontend server is running' });
});

// Catch-all for 404s
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Frontend Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 Backend API: http://localhost:5000`);
  console.log(`\n💡 Open your browser and navigate to http://localhost:${PORT}\n`);
});
