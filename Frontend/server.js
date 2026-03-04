const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve all folders as static
app.use('/login', express.static(path.join(__dirname, 'login page')));
app.use('/client', express.static(path.join(__dirname, 'ClientProfile_Page')));
app.use('/freelancer', express.static(path.join(__dirname, 'Freelancer')));
app.use('/landing', express.static(path.join(__dirname, 'Landing_Page')));

// Default redirect to login
app.get('/', (req, res) => {
  res.redirect('/login/login.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ message: '✅ Frontend server is running' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Frontend Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 Backend API: http://localhost:8000/api`);
  console.log(`\n💡 Open your browser and navigate to http://localhost:${PORT}\n`);
});
