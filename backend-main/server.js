require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

// --- 1. Reverse Proxy Trust (Required for Render) ---
app.set('trust proxy', 1);

// --- 2. Advanced Security Headers ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", 'https://sapkotap.com.np', 'https://www.sapkotap.com.np'],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// --- 3. Strict CORS Configuration ---
const allowedOrigins = ['https://sapkotap.com.np', 'https://www.sapkotap.com.np'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS security policy.'));
    }
  },
  credentials: true, // Allows secure HttpOnly cookie transmission
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- 4. Body Parsers & Sanitation ---
app.use(express.json({ limit: '10kb' })); // Prevents large-payload DoS attacks
app.use(cookieParser());
app.use(mongoSanitize()); // Strips $ and . operators to block NoSQL injection

// --- 5. Strict Rate Limiting ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Reduced from 10 to 5 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Access locked for 15 minutes.' }
});
app.use('/api/auth', authLimiter);

// Global API rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please slow down.' }
});
app.use('/api', globalLimiter);

// --- 6. Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB securely'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- 7. Fortified Admin Verification Middleware ---
const verifyAdmin = (req, res, next) => {
  // Read token from HttpOnly Cookie or Bearer Header
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid, expired, or tampered token.' });
  }
};

// --- 8. Routes ---
app.get('/', (req, res) => {
  res.send('Server is running with enhanced security configurations.');
});

// Example Login Route showing HttpOnly Cookie implementation
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  // Perform user lookup & password check using bcrypt.compare()
  // If valid and role === 'admin':
  const token = jwt.sign(
    { userId: 'admin_id_here', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h', algorithm: 'HS256' }
  );

  // Set HttpOnly Cookie (Inaccessible to browser JS / immune to XSS)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  });

  res.json({ message: 'Authentication successful.' });
});

// Protected Admin Dashboard Route
app.get('/api/admin/dashboard', verifyAdmin, (req, res) => {
  res.json({ message: 'Welcome to the protected admin portal!' });
});

// --- 9. Error Handling ---
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected security error occurred.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Fortified server running on port ${PORT}`));