require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// --- Security middleware ---
app.use(helmet());

// Allow requests only from your domain (+ localhost during development)
const allowedOrigins = ['https://sapkotap.com.np', 'https://www.sapkotap.com.np'];

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

const corsOptions = {
  origin: allowedOrigins,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(mongoSanitize()); // Blocks NoSQL injection via $ and . operators

// Rate limiter for auth routes (login/signup) to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per window
  message: 'Too many attempts, please try again later.'
});
app.use('/api/auth', authLimiter);

// --- Database connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- Routes ---
app.get('/', (req, res) => {
  res.send('Server is running and connected to MongoDB!');
});

// --- 404 handler for unmatched routes ---
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// --- Error handling (never leak stack traces to users) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));