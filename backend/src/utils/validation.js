const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errors');

function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            meta: { errors: errors.array() },
        });
    }
    next();
}

const registerRules = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['customer', 'vendor']).withMessage('Role must be customer or vendor'),
];

const loginRules = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

const otpRules = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
];

const bookingRules = [
    body('vendor_id').isUUID().withMessage('Valid vendor ID is required'),
    body('service_id').isUUID().withMessage('Valid service ID is required'),
    body('address_id').isUUID().withMessage('Valid address ID is required'),
    body('scheduled_date').isISO8601().withMessage('Valid date is required'),
    body('scheduled_time').matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM format'),
];

const statusUpdateRules = [
    body('status').isIn(['accepted', 'rejected', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
];

const messageRules = [
    body('content').trim().notEmpty().withMessage('Message content is required'),
];

const addressRules = [
    body('label').trim().notEmpty().withMessage('Address label is required'),
    body('line1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('pincode').trim().notEmpty().withMessage('Pincode is required'),
    body('lat').optional().isFloat({ min: -90, max: 90 }),
    body('lng').optional().isFloat({ min: -180, max: 180 }),
];

module.exports = {
    validate,
    registerRules,
    loginRules,
    otpRules,
    bookingRules,
    statusUpdateRules,
    messageRules,
    addressRules,
    body,
    param,
    query,
};
