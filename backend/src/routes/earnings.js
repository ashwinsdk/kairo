const router = require('express').Router();
const db = require('../utils/db');
const { authenticate, authorize } = require('../utils/middleware');

// GET /api/earnings — vendor earnings
router.get('/', authenticate, authorize('vendor'), async (req, res, next) => {
    try {
        // Auto-create vendor_profile if it doesn't exist
        let vendorProfile = await db('vendor_profiles').where('user_id', req.user.id).first();
        if (!vendorProfile) {
            const user = await db('users').where('id', req.user.id).first();
            [vendorProfile] = await db('vendor_profiles').insert({
                user_id: req.user.id,
                business_name: user.name,
                category_id: null,
                kyc_status: 'pending',
            }).returning('*');
        }

        // Total earnings
        const [totalResult] = await db('payments')
            .where('vendor_id', vendorProfile.id)
            .where('status', 'success')
            .sum('amount as total');

        // This week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const [weekResult] = await db('payments')
            .where('vendor_id', vendorProfile.id)
            .where('status', 'success')
            .where('paid_at', '>=', startOfWeek)
            .sum('amount as total');

        // This month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [monthResult] = await db('payments')
            .where('vendor_id', vendorProfile.id)
            .where('status', 'success')
            .where('paid_at', '>=', startOfMonth)
            .sum('amount as total');

        // Today completed jobs
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [todayJobs] = await db('bookings')
            .where('vendor_id', vendorProfile.id)
            .where('status', 'completed')
            .where('completed_at', '>=', todayStart)
            .count();

        // Recent payments
        const recentPayments = await db('payments as p')
            .join('bookings as b', 'b.id', 'p.booking_id')
            .leftJoin('users as c', 'c.id', 'p.customer_id')
            .select('p.*', 'c.name as customer_name', 'b.scheduled_date')
            .where('p.vendor_id', vendorProfile.id)
            .orderBy('p.created_at', 'desc')
            .limit(20);

        res.json({
            code: 'SUCCESS',
            data: {
                total_earnings: parseFloat(totalResult.total) || 0,
                this_week: parseFloat(weekResult.total) || 0,
                this_month: parseFloat(monthResult.total) || 0,
                today_completed: parseInt(todayJobs.count),
                recent_payments: recentPayments,
            },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
