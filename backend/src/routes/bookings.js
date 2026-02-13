const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../utils/db');
const { authenticate, authorize } = require('../utils/middleware');
const { bookingRules, statusUpdateRules, validate, body } = require('../utils/validation');
const { sendBookingEmail } = require('../services/email');
const logger = require('../utils/logger');

// POST /api/bookings — create booking request
router.post('/', authenticate, authorize('customer'), bookingRules, validate, async (req, res, next) => {
    try {
        const { vendor_id, service_id, address_id, scheduled_date, scheduled_time, notes } = req.body;
        console.log(`[bookings] Creating booking - vendor_id: ${vendor_id}, service_id: ${service_id}`);

        // Validate date is not in the past
        const bookingDateTime = new Date(`${scheduled_date}T${scheduled_time}`);
        if (bookingDateTime < new Date()) {
            return res.status(400).json({ code: 'INVALID_DATE', message: 'Cannot book in the past.' });
        }

        // Get service pricing
        const vendorService = await db('vendor_services').where('id', service_id).first();
        if (!vendorService) {
            console.log(`[bookings] Service not found: ${service_id}`);
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Service not found.' });
        }

        console.log(`[bookings] Found service, base_price: ${vendorService.base_price}`);

        // Verify vendor exists
        const vendor = await db('vendor_profiles').where('id', vendor_id).first();
        if (!vendor) {
            console.log(`[bookings] Vendor not found: ${vendor_id}`);
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Vendor not found.' });
        }

        console.log(`[bookings] Found vendor: ${vendor.business_name}`);

        const estimatedPrice = parseFloat(vendorService.base_price);
        const travelFee = 0; // can be calculated based on distance
        const tax = Math.round(estimatedPrice * 0.05 * 100) / 100; // 5% tax

        // Generate job OTP
        const jobOtp = crypto.randomInt(1000, 9999).toString();
        const jobOtpHash = await bcrypt.hash(jobOtp, 10);

        const [booking] = await db('bookings').insert({
            customer_id: req.user.id,
            vendor_id,
            service_id,
            address_id,
            scheduled_date,
            scheduled_time,
            estimated_price: estimatedPrice + travelFee + tax,
            travel_fee: travelFee,
            tax,
            job_otp_hash: jobOtpHash,
            job_otp: jobOtp,
        }).returning('*');

        console.log(`[bookings] Booking created successfully: ${booking.id}`);

        // Record status history
        await db('booking_status_history').insert({
            booking_id: booking.id,
            status: 'requested',
            changed_by: req.user.id,
        });

        // Create chat for booking
        await db('chats').insert({
            booking_id: booking.id,
            customer_id: req.user.id,
            vendor_user_id: vendor.user_id,
        });

        // Notify vendor
        await db('notifications').insert({
            user_id: vendor.user_id,
            type: 'booking_update',
            title: 'New Booking Request',
            body: `You have a new booking request for ${scheduled_date} at ${scheduled_time}`,
            data: JSON.stringify({ booking_id: booking.id }),
        });

        logger.info(`Booking created: ${booking.id}`);
        res.status(201).json({
            code: 'BOOKING_CREATED',
            message: 'Booking request sent to vendor.',
            data: { ...booking, job_otp: jobOtp },
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/bookings — list user bookings
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;
        const role = req.user.role;

        let q = db('bookings as b')
            .leftJoin('vendor_services as vs', 'vs.id', 'b.service_id')
            .leftJoin('services as s', 's.id', 'vs.service_id')
            .leftJoin('vendor_profiles as vp', 'vp.id', 'b.vendor_id')
            .leftJoin('users as vendor_user', 'vendor_user.id', 'vp.user_id')
            .leftJoin('users as customer', 'customer.id', 'b.customer_id')
            .leftJoin('addresses as a', 'a.id', 'b.address_id')
            .select(
                'b.*',
                's.name as service_name',
                'vp.business_name',
                'vendor_user.name as vendor_name',
                'vendor_user.photo_url as vendor_photo',
                'vendor_user.is_online as vendor_online',
                'customer.name as customer_name',
                'customer.phone as customer_phone',
                'a.line1 as address_line1',
                'a.city as address_city',
                'a.lat as address_lat',
                'a.lng as address_lng'
            );

        if (role === 'customer') {
            q = q.where('b.customer_id', userId);
        } else if (role === 'vendor') {
            const vendorProfile = await db('vendor_profiles').where('user_id', userId).first();
            if (vendorProfile) {
                q = q.where('b.vendor_id', vendorProfile.id);
            }
        }

        if (status) {
            q = q.where('b.status', status);
        }

        const bookings = await q.orderBy('b.created_at', 'desc').offset(offset).limit(limit);
        res.json({ code: 'SUCCESS', data: bookings });
    } catch (err) {
        next(err);
    }
});

// GET /api/bookings/:id — booking detail
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const booking = await db('bookings as b')
            .leftJoin('vendor_services as vs', 'vs.id', 'b.service_id')
            .leftJoin('services as s', 's.id', 'vs.service_id')
            .leftJoin('vendor_profiles as vp', 'vp.id', 'b.vendor_id')
            .leftJoin('users as vendor_user', 'vendor_user.id', 'vp.user_id')
            .leftJoin('users as customer', 'customer.id', 'b.customer_id')
            .leftJoin('addresses as a', 'a.id', 'b.address_id')
            .select(
                'b.*',
                's.name as service_name', 's.description as service_description',
                'vp.business_name', 'vp.rating_avg', 'vp.rating_count',
                'vendor_user.name as vendor_name', 'vendor_user.photo_url as vendor_photo',
                'vendor_user.phone as vendor_phone', 'vendor_user.is_online as vendor_online',
                'customer.name as customer_name', 'customer.phone as customer_phone',
                'customer.email as customer_email',
                'a.label as address_label', 'a.line1 as address_line1', 'a.line2 as address_line2',
                'a.city as address_city', 'a.pincode as address_pincode',
                'a.lat as address_lat', 'a.lng as address_lng'
            )
            .where('b.id', req.params.id)
            .first();

        if (!booking) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' });
        }

        const history = await db('booking_status_history')
            .where('booking_id', booking.id)
            .orderBy('changed_at', 'asc');

        const payment = await db('payments').where('booking_id', booking.id).first();

        const responseData = { ...booking, history, payment };
        if (req.user.role !== 'customer') {
            delete responseData.job_otp;
        }

        res.json({ code: 'SUCCESS', data: responseData });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/bookings/:id/status — update booking status
router.patch('/:id/status', authenticate, authorize('vendor', 'admin', 'customer'), statusUpdateRules, validate, async (req, res, next) => {
    try {
        const { status, reason } = req.body;
        const bookingId = req.params.id;

        const booking = await db('bookings').where('id', bookingId).first();
        if (!booking) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' });
        }

        const updates = { status, updated_at: new Date() };

        if (status === 'accepted') updates.accepted_at = new Date();
        if (status === 'completed') updates.completed_at = new Date();
        if (status === 'cancelled') {
            updates.cancellation_reason = reason;
            updates.cancelled_by = req.user.id;
            if (req.user.role === 'customer') {
                updates.cancellation_fee = 1.00; // Rs.1 fee
            }
        }
        if (status === 'rejected' && reason) {
            updates.cancellation_reason = reason;
        }

        await db('bookings').where('id', bookingId).update(updates);

        await db('booking_status_history').insert({
            booking_id: bookingId,
            status,
            changed_by: req.user.id,
            meta: JSON.stringify({ reason }),
        });

        // Notify relevant party
        const notifyUserId = req.user.role === 'vendor' ? booking.customer_id : (
            await db('vendor_profiles').where('id', booking.vendor_id).first()
        )?.user_id;

        if (notifyUserId) {
            await db('notifications').insert({
                user_id: notifyUserId,
                type: 'booking_update',
                title: `Booking ${status}`,
                body: `Your booking has been ${status}.`,
                data: JSON.stringify({ booking_id: bookingId, status }),
            });
        }

        res.json({ code: 'STATUS_UPDATED', message: `Booking ${status}.`, data: { id: bookingId, status } });
    } catch (err) {
        next(err);
    }
});

// POST /api/bookings/:id/verify-otp — job OTP verification
router.post('/:id/verify-otp', authenticate, authorize('vendor'), async (req, res, next) => {
    try {
        const { otp } = req.body;
        const booking = await db('bookings').where('id', req.params.id).first();
        if (!booking) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' });
        }

        const isMatch = await bcrypt.compare(otp, booking.job_otp_hash);
        if (!isMatch) {
            return res.status(400).json({ code: 'INVALID_OTP', message: 'Incorrect job OTP.' });
        }

        await db('bookings').where('id', req.params.id).update({
            job_otp_verified: true,
            status: 'in_progress',
            updated_at: new Date(),
        });

        await db('booking_status_history').insert({
            booking_id: req.params.id,
            status: 'in_progress',
            changed_by: req.user.id,
            meta: JSON.stringify({ otp_verified: true }),
        });

        res.json({ code: 'OTP_VERIFIED', message: 'Job OTP verified. Job started.' });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/bookings/:id/price — vendor updates price
router.patch('/:id/price', authenticate, authorize('vendor'), async (req, res, next) => {
    try {
        const { final_price, reason } = req.body;
        if (!final_price || !reason) {
            return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Price and reason are required.' });
        }

        await db('bookings').where('id', req.params.id).update({
            final_price,
            price_update_reason: reason,
            updated_at: new Date(),
        });

        // Notify customer
        const booking = await db('bookings').where('id', req.params.id).first();
        await db('notifications').insert({
            user_id: booking.customer_id,
            type: 'payment_alert',
            title: 'Price Updated',
            body: `Vendor updated the price to Rs.${final_price}. Reason: ${reason}`,
            data: JSON.stringify({ booking_id: req.params.id, final_price, reason }),
        });

        res.json({ code: 'PRICE_UPDATED', message: 'Price updated successfully.' });
    } catch (err) {
        next(err);
    }
});

// POST /api/bookings/:id/rate — submit rating
router.post('/:id/rate', authenticate, authorize('customer'), async (req, res, next) => {
    try {
        const { score, review } = req.body;
        if (!score || score < 1 || score > 5) {
            return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Score must be 1-5.' });
        }

        const booking = await db('bookings').where('id', req.params.id).first();
        if (!booking || booking.status !== 'completed') {
            return res.status(400).json({ code: 'INVALID_STATE', message: 'Can only rate completed bookings.' });
        }

        const existing = await db('ratings').where('booking_id', req.params.id).first();
        if (existing) {
            return res.status(409).json({ code: 'ALREADY_RATED', message: 'Already rated.' });
        }

        // Rating published after 5 minutes
        const publishedAt = new Date(Date.now() + 5 * 60 * 1000);

        await db('ratings').insert({
            booking_id: req.params.id,
            customer_id: req.user.id,
            vendor_id: booking.vendor_id,
            score,
            review,
            is_published: false,
            published_at: publishedAt,
        });

        // Update vendor avg rating (will be finalized when published)
        const stats = await db('ratings')
            .where('vendor_id', booking.vendor_id)
            .avg('score as avg')
            .count('* as count')
            .first();

        await db('vendor_profiles').where('id', booking.vendor_id).update({
            rating_avg: Math.round((parseFloat(stats.avg) || 0) * 10) / 10,
            rating_count: parseInt(stats.count) || 0,
        });

        res.json({ code: 'RATING_SUBMITTED', message: 'Rating submitted. It will be published shortly.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
