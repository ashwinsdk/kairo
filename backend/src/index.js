require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const bookingRoutes = require('./routes/bookings');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const earningsRoutes = require('./routes/earnings');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const healthRoutes = require('./routes/health');

const { maintenanceCheck } = require('./utils/middleware');
const { errorHandler, notFound } = require('./utils/errors');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Logging
app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Maintenance mode check (except health)
app.use('/api', maintenanceCheck);

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// 404 and error handler
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Kairo backend running on port ${PORT}`);
});

module.exports = app;
