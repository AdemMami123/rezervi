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
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
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

app.use('/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api', clientRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
