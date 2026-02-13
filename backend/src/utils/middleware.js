const jwt = require('jsonwebtoken');
const { AppError } = require('./errors');
const db = require('./db');
const logger = require('./logger');

function maintenanceCheck(req, res, next) {
    // Allow admin and auth endpoints to stay reachable so maintenance can be disabled and admins can still log in.
    const path = req.originalUrl || '';
    const isAdminPath = path.startsWith('/api/admin');
    const isAuthPath = path.startsWith('/api/auth/refresh') || path.startsWith('/api/auth/login') || path.startsWith('/api/auth/me');
    if (isAdminPath || isAuthPath) return next();

    if (process.env.MAINTENANCE_MODE === 'true') {
        return res.status(503).json({
            code: 'MAINTENANCE',
            message: 'Kairo Services is currently undergoing maintenance. Please try again shortly.',
        });
    }
    next();
}

function authenticate(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    }
}

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
        }
        next();
    };
}

async function optionalAuth(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            // ignore
        }
    }
    next();
}

module.exports = { maintenanceCheck, authenticate, authorize, optionalAuth };
