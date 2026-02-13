const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_KEY,
    },
});

async function sendOtpEmail(to, otp, purpose = 'verification') {
    const subject = purpose === 'registration'
        ? 'Kairo Services -- Verify Your Email'
        : 'Kairo Services -- Your Login Code';

    const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #111; color: #fff; border-radius: 0;">
      <div style="background: linear-gradient(90deg, #00bfa6, #00796b); padding: 2px;">
        <div style="background: #111; padding: 24px;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">KAIRO SERVICES</h1>
          <p style="margin: 0; color: #aaa; font-size: 14px;">Your verification code</p>
        </div>
      </div>
      <div style="padding: 32px 0;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #ccc;">Use this code to ${purpose === 'registration' ? 'verify your account' : 'sign in'}:</p>
        <div style="background: #1a1a1a; border: 2px solid #00bfa6; padding: 16px; text-align: center; letter-spacing: 12px; font-size: 36px; font-weight: 800; font-family: monospace; color: #00bfa6;">
          ${otp}
        </div>
        <p style="margin: 16px 0 0; font-size: 13px; color: #666;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
      <div style="border-top: 1px solid #333; padding-top: 16px; font-size: 12px; color: #555;">
        Kairo Services -- Empowering hyperlocal businesses
      </div>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Kairo Services'}" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
        });
        logger.info(`OTP email sent to ${to} for ${purpose}`);
        return true;
    } catch (error) {
        logger.error('Failed to send OTP email', { error: error.message, to });
        throw error;
    }
}

async function sendBookingEmail(to, bookingData, type) {
    const subjects = {
        requested: 'New Booking Request',
        accepted: 'Booking Accepted',
        rejected: 'Booking Update',
        completed: 'Booking Completed',
        cancelled: 'Booking Cancelled',
    };

    const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #111; color: #fff;">
      <h2 style="color: #00bfa6; margin: 0 0 16px;">Kairo Services</h2>
      <p>${subjects[type] || 'Booking Update'}</p>
      <p style="color: #ccc;">Booking #${bookingData.id?.substring(0, 8)}</p>
      <p style="font-size: 12px; color: #666; margin-top: 24px;">Kairo Services</p>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Kairo Services'}" <${process.env.EMAIL_FROM}>`,
            to,
            subject: `Kairo Services -- ${subjects[type] || 'Update'}`,
            html,
        });
    } catch (error) {
        logger.error('Failed to send booking email', { error: error.message });
    }
}

module.exports = { sendOtpEmail, sendBookingEmail };
