require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
    ];
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // permissive for local development
  },
  credentials: true,
}));

app.use(express.json());

// General rate limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth routes: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' },
});

app.use(generalLimiter);

app.get('/', (req, res) => {
  res.send('WasteNet API is running');
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log('Server running on port ' + PORT));
  })
  .catch((err) => console.log('MongoDB connection failed:', err.message));
