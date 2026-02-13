const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { registerRules, loginRules, otpRules, validate } = require('../utils/validation');
const authService = require('../services/auth');
const { authenticate } = require('../utils/middleware');
const logger = require('../utils/logger');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { code: 'RATE_LIMIT', message: 'Too many auth attempts. Please wait.' },
});

// POST /api/auth/register
router.post('/register', authLimiter, registerRules, validate, async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const result = await authService.registerUser({ name, email, password, role });
        res.status(201).json({
            code: 'REGISTERED',
            message: 'Registration successful. Check your email for the OTP.',
            data: result,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', authLimiter, otpRules, validate, async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyAndActivate(email, otp);
        // Set HttpOnly cookie
        const ttl = 7 * 24 * 60 * 60 * 1000;
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: ttl,
        });
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: ttl,
            path: '/api/auth/refresh',
        });
        res.json({
            code: 'VERIFIED',
            message: 'Email verified successfully.',
            data: { token: result.token, user: result.user },
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, loginRules, validate, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser({ email, password });
        if (result.needsOtp) {
            return res.status(403).json({
                code: 'NEEDS_OTP',
                message: 'Account not verified. OTP sent to your email.',
                data: { email: result.email },
            });
        }
        const ttl = 7 * 24 * 60 * 60 * 1000;
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: ttl,
        });
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: ttl,
            path: '/api/auth/refresh',
        });
        res.json({
            code: 'LOGIN_SUCCESS',
            message: 'Login successful.',
            data: { token: result.token, user: result.user },
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ code: 'NO_TOKEN', message: 'Refresh token required.' });
        }
        const result = await authService.refreshAccessToken(refreshToken);
        const ttl = 7 * 24 * 60 * 60 * 1000;
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: ttl,
        });
        res.json({
            code: 'TOKEN_REFRESHED',
            message: 'Token refreshed.',
            data: result,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', authLimiter, async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.createAndSendOtp(email, 'login');
        res.json({ code: 'OTP_SENT', message: 'OTP sent to your email.' });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        await authService.logoutUser(req.user.id);
        res.clearCookie('token');
        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
        res.json({ code: 'LOGGED_OUT', message: 'Logged out successfully.' });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const db = require('../utils/db');
        const user = await db('users')
            .select('id', 'name', 'email', 'role', 'is_verified', 'photo_url', 'phone', 'lat', 'lng', 'locality', 'city', 'analytics_opt_in', 'created_at')
            .where('id', req.user.id)
            .first();
        if (!user) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
        }
        res.json({ code: 'SUCCESS', data: user });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
