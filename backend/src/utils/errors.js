const logger = require('./logger');

class AppError extends Error {
    constructor(code, message, statusCode = 500, meta = {}) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.meta = meta;
    }
}

function notFound(req, res, next) {
    res.status(404).json({
        code: 'NOT_FOUND',
        message: `Route ${req.originalUrl} not found`,
    });
}

function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected error occurred';

    logger.error({
        code,
        message,
        statusCode,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    res.status(statusCode).json({
        code,
        message: statusCode === 500 && process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : message,
        meta: err.meta || {},
    });
}

module.exports = { AppError, notFound, errorHandler };
