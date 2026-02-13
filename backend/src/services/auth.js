const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const logger = require('../utils/logger');
const { sendOtpEmail } = require('./email');
const { AppError } = require('../utils/errors');

function generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
}

async function checkThrottle(email) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const throttle = await db('otp_throttle')
        .where('email', email)
        .where('window_start', '>', oneHourAgo)
        .first();

    if (throttle && throttle.send_count >= 3) {
        throw new AppError('OTP_THROTTLED', 'Too many OTP requests. Please try again later.', 429);
    }

    if (throttle) {
        await db('otp_throttle').where('id', throttle.id).increment('send_count', 1);
    } else {
        await db('otp_throttle').insert({ email, send_count: 1, window_start: new Date() });
    }
}

async function createAndSendOtp(email, purpose = 'registration') {
    await checkThrottle(email);

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate previous OTPs
    await db('otps').where('email', email).where('used', false).update({ used: true });

    await db('otps').insert({
        email,
        otp_hash: otpHash,
        purpose,
        expires_at: expiresAt,
    });

    await sendOtpEmail(email, otp, purpose);
    logger.info(`OTP created for ${email}, purpose: ${purpose}`);
    return true;
}

async function verifyOtp(email, otpInput) {
    const otpRecord = await db('otps')
        .where('email', email)
        .where('used', false)
        .where('expires_at', '>', new Date())
        .orderBy('created_at', 'desc')
        .first();

    if (!otpRecord) {
        throw new AppError('OTP_INVALID', 'OTP is invalid or expired.', 400);
    }

    const isMatch = await bcrypt.compare(otpInput, otpRecord.otp_hash);
    if (!isMatch) {
        await db('otps').where('id', otpRecord.id).increment('attempts', 1);
        throw new AppError('OTP_INVALID', 'Incorrect OTP.', 400);
    }

    await db('otps').where('id', otpRecord.id).update({ used: true });
    return true;
}

async function registerUser({ name, email, password, role = 'customer' }) {
    const existing = await db('users').where('email', email).first();
    if (existing && existing.is_verified) {
        throw new AppError('EMAIL_EXISTS', 'An account with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    if (existing && !existing.is_verified) {
        // Re-register unverified user
        [user] = await db('users')
            .where('id', existing.id)
            .update({ name, password_hash: passwordHash, role, updated_at: new Date() })
            .returning('*');
    } else {
        [user] = await db('users')
            .insert({ name, email, password_hash: passwordHash, role })
            .returning('*');
    }

    await createAndSendOtp(email, 'registration');

    return { id: user.id, email: user.email, role: user.role };
}

async function loginUser({ email, password }) {
    const user = await db('users').where('email', email).first();
    if (!user) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }
    if (user.is_blocked) {
        throw new AppError('ACCOUNT_BLOCKED', 'Your account has been blocked. Contact support.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    if (!user.is_verified) {
        await createAndSendOtp(email, 'login');
        return { needsOtp: true, email: user.email };
    }

    return issueTokens(user);
}

async function issueTokens(user) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessTtl = process.env.JWT_EXPIRES_IN || '7d';
    const refreshTtl = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: accessTtl });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: refreshTtl });

    // Store refresh token
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await db('sessions').insert({
        user_id: user.id,
        refresh_token_hash: refreshHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await db('users').where('id', user.id).update({ last_login: new Date() });

    return {
        token,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: user.is_verified },
    };
}

async function verifyAndActivate(email, otp) {
    await verifyOtp(email, otp);
    const [user] = await db('users').where('email', email).update({ is_verified: true }).returning('*');

    // Auto-create vendor_profile for vendor users
    if (user.role === 'vendor') {
        const existingProfile = await db('vendor_profiles').where('user_id', user.id).first();
        if (!existingProfile) {
            await db('vendor_profiles').insert({
                user_id: user.id,
                business_name: user.name,
                category_id: null,
                kyc_status: 'pending',
            });
            logger.info(`Created vendor_profile for user ${user.id}`);
        }
    }

    return issueTokens(user);
}

async function refreshAccessToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const sessions = await db('sessions')
            .where('user_id', decoded.id)
            .where('expires_at', '>', new Date());

        let valid = false;
        for (const session of sessions) {
            if (await bcrypt.compare(refreshToken, session.refresh_token_hash)) {
                valid = true;
                break;
            }
        }

        if (!valid) throw new Error('Invalid refresh token');

        const user = await db('users').where('id', decoded.id).first();
        if (!user) throw new Error('User not found');

        const payload = { id: user.id, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    } catch (e) {
        throw new AppError('INVALID_TOKEN', 'Invalid or expired refresh token.', 401);
    }
}

async function logoutUser(userId) {
    await db('sessions').where('user_id', userId).del();
    return true;
}

module.exports = {
    registerUser,
    loginUser,
    verifyAndActivate,
    refreshAccessToken,
    logoutUser,
    createAndSendOtp,
    issueTokens,
};
