const router = require('express').Router();
const db = require('../utils/db');
const { authenticate, authorize } = require('../utils/middleware');

// GET /api/admin/dashboard
router.get('/dashboard', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const [vendorCount] = await db('users').where('role', 'vendor').count();
        const [customerCount] = await db('users').where('role', 'customer').count();
        const [activeUsers] = await db('users')
            .where('last_login', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
            .count();
        const [pendingKyc] = await db('vendor_profiles').where('kyc_status', 'submitted').count();
        const [totalEarnings] = await db('payments').where('status', 'success').sum('amount as total');
        const [pendingBookings] = await db('bookings').where('status', 'requested').count();

        res.json({
            code: 'SUCCESS',
            data: {
                vendor_count: parseInt(vendorCount.count),
                customer_count: parseInt(customerCount.count),
                active_users_24h: parseInt(activeUsers.count),
                pending_kyc: parseInt(pendingKyc.count),
                total_earnings: parseFloat(totalEarnings.total) || 0,
                pending_bookings: parseInt(pendingBookings.count),
            },
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/maintenance — current status
router.get('/maintenance', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        res.json({ code: 'SUCCESS', data: { enabled: process.env.MAINTENANCE_MODE === 'true' } });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/kyc — list pending KYC
router.get('/kyc', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { status = 'submitted', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const vendors = await db('vendor_profiles as vp')
            .join('users as u', 'u.id', 'vp.user_id')
            .select('vp.*', 'u.name', 'u.email', 'u.photo_url', 'u.created_at as user_created_at')
            .where('vp.kyc_status', status)
            .orderBy('vp.created_at', 'desc')
            .offset(offset)
            .limit(limit);

        // Get documents for each vendor
        for (const vendor of vendors) {
            vendor.documents = await db('vendor_documents').where('vendor_id', vendor.id);
        }

        res.json({ code: 'SUCCESS', data: vendors });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/admin/kyc/:vendorId — approve/reject KYC
router.patch('/kyc/:vendorId', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { action, reason } = req.body; // approve, reject, resubmit
        if (!['approved', 'rejected', 'resubmit'].includes(action)) {
            return res.status(400).json({ code: 'INVALID_ACTION', message: 'Action must be approve, reject, or resubmit' });
        }

        await db('vendor_profiles').where('id', req.params.vendorId).update({
            kyc_status: action,
            is_verified: action === 'approved',
            updated_at: new Date(),
        });

        if (action === 'approved') {
            const vendor = await db('vendor_profiles').where('id', req.params.vendorId).first();
            await db('users').where('id', vendor.user_id).update({ is_verified: true });
        }

        // Audit log
        await db('admin_actions').insert({
            admin_id: req.user.id,
            action: `kyc_${action}`,
            target_type: 'vendor',
            target_id: req.params.vendorId,
            details: JSON.stringify({ reason }),
        });

        // Notify vendor
        const vendor = await db('vendor_profiles').where('id', req.params.vendorId).first();
        await db('notifications').insert({
            user_id: vendor.user_id,
            type: 'system_alert',
            title: `KYC ${action === 'approved' ? 'Approved' : action === 'rejected' ? 'Rejected' : 'Resubmission Required'}`,
            body: reason || `Your KYC verification has been ${action}.`,
        });

        res.json({ code: 'KYC_UPDATED', message: `Vendor KYC ${action}.` });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/users — customer management
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { role, search, blocked, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let q = db('users').select('id', 'name', 'email', 'role', 'is_verified', 'is_blocked', 'created_at', 'last_login');

        if (role) q = q.where('role', role);
        if (blocked !== undefined) q = q.where('is_blocked', blocked === 'true');
        if (search) {
            q = q.where(function () {
                this.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`);
            });
        }

        const users = await q.orderBy('created_at', 'desc').offset(offset).limit(limit);
        const [{ count }] = await db('users').count();

        res.json({ code: 'SUCCESS', data: users, meta: { total: parseInt(count) } });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/admin/users/:id/block — block/unblock user
router.patch('/users/:id/block', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { blocked } = req.body;
        await db('users').where('id', req.params.id).update({ is_blocked: blocked });

        await db('admin_actions').insert({
            admin_id: req.user.id,
            action: blocked ? 'user_blocked' : 'user_unblocked',
            target_type: 'user',
            target_id: req.params.id,
        });

        res.json({ code: 'SUCCESS', message: `User ${blocked ? 'blocked' : 'unblocked'}.` });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/admin/maintenance — toggle maintenance mode
router.patch('/maintenance', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { enabled } = req.body;
        process.env.MAINTENANCE_MODE = enabled ? 'true' : 'false';

        await db('admin_actions').insert({
            admin_id: req.user.id,
            action: enabled ? 'maintenance_enabled' : 'maintenance_disabled',
            target_type: 'system',
        });

        res.json({ code: 'SUCCESS', message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}.` });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/actions — audit log
router.get('/actions', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const actions = await db('admin_actions as aa')
            .leftJoin('users as u', 'u.id', 'aa.admin_id')
            .select('aa.*', 'u.name as admin_name')
            .orderBy('aa.created_at', 'desc')
            .offset(offset)
            .limit(limit);

        res.json({ code: 'SUCCESS', data: actions });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
