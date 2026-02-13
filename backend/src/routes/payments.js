const router = require('express').Router();
const db = require('../utils/db');
const { authenticate } = require('../utils/middleware');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// POST /api/payments — process payment (mock)
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { booking_id, method = 'cash' } = req.body;

        const booking = await db('bookings').where('id', booking_id).first();
        if (!booking) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' });
        }

        const amount = booking.final_price || booking.estimated_price;

        if (method === 'online_mock') {
            // Simulate payment: 90% success rate
            const success = Math.random() < 0.9;
            const [payment] = await db('payments').insert({
                booking_id,
                customer_id: booking.customer_id,
                vendor_id: booking.vendor_id,
                amount,
                method: 'online_mock',
                status: success ? 'success' : 'failed',
                transaction_ref: `MOCK_${uuidv4().substring(0, 8).toUpperCase()}`,
                paid_at: success ? new Date() : null,
            }).returning('*');

            logger.info(`Mock payment ${success ? 'success' : 'failed'}: ${payment.id}`);

            return res.json({
                code: success ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
                message: success
                    ? 'Mock payment -- test environment. Payment successful.'
                    : 'Mock payment -- test environment. Payment failed. Please try again.',
                data: payment,
            });
        }

        // Cash payment
        const [payment] = await db('payments').insert({
            booking_id,
            customer_id: booking.customer_id,
            vendor_id: booking.vendor_id,
            amount,
            method: 'cash',
            status: 'pending',
            transaction_ref: `CASH_${uuidv4().substring(0, 8).toUpperCase()}`,
        }).returning('*');

        res.json({
            code: 'PAYMENT_RECORDED',
            message: 'Cash payment recorded. Pay vendor directly.',
            data: payment,
        });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/payments/:id/confirm — vendor confirms cash payment
router.patch('/:id/confirm', authenticate, async (req, res, next) => {
    try {
        const [payment] = await db('payments')
            .where('id', req.params.id)
            .update({ status: 'success', paid_at: new Date() })
            .returning('*');

        if (!payment) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Payment not found' });
        }

        res.json({ code: 'PAYMENT_CONFIRMED', data: payment });
    } catch (err) {
        next(err);
    }
});

// GET /api/payments/history — payment history
router.get('/history', authenticate, async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const payments = await db('payments as p')
            .join('bookings as b', 'b.id', 'p.booking_id')
            .leftJoin('vendor_services as vs', 'vs.id', 'b.service_id')
            .leftJoin('services as s', 's.id', 'vs.service_id')
            .select('p.*', 's.name as service_name', 'b.scheduled_date')
            .where('p.customer_id', req.user.id)
            .orderBy('p.created_at', 'desc')
            .offset(offset)
            .limit(limit);

        res.json({ code: 'SUCCESS', data: payments });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
