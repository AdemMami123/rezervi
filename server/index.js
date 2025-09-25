require("dotenv").config();
const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const clientRoutes = require('./routes/clientRoutes');
const userRoutes = require('./routes/userRoutes');

// Cookie parser should be early in the middleware chain
app.use(cookieParser());

// Custom CORS middleware to ensure correct headers for credentials
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://rezervi-d750.onrender.com',
    'https://rezervi-nine.vercel.app', // Your Vercel URL - update this once you get it
    process.env.CLIENT_URL
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Log cookies on all requests for debugging
  console.log('Cookies received:', req.cookies);
  
  next();
});

// Handle preflight OPTIONS requests for all routes
app.options('*', (req, res) => {
  res.sendStatus(200);
});

app.use(express.json());

// Root route - API health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Rezervi API is running!', 
    version: '1.0.0',
    endpoints: {
      auth: '/auth/*',
      business: '/api/business/*',
      client: '/api/*',
      user: '/api/user/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api', clientRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server running on port ${PORT}`)
);
