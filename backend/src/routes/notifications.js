const router = require('express').Router();
const db = require('../utils/db');
const { authenticate } = require('../utils/middleware');

// GET /api/notifications
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { page = 1, limit = 30, unread_only } = req.query;
        const offset = (page - 1) * limit;

        let q = db('notifications').where('user_id', req.user.id);
        if (unread_only === 'true') {
            q = q.where('is_read', false);
        }

        const notifications = await q.orderBy('created_at', 'desc').offset(offset).limit(limit);
        const [{ count }] = await db('notifications')
            .where('user_id', req.user.id)
            .where('is_read', false)
            .count();

        res.json({
            code: 'SUCCESS',
            data: notifications,
            meta: { unread_count: parseInt(count) },
        });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res, next) => {
    try {
        await db('notifications')
            .where('id', req.params.id)
            .where('user_id', req.user.id)
            .update({ is_read: true });
        res.json({ code: 'SUCCESS', message: 'Notification marked as read' });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res, next) => {
    try {
        await db('notifications').where('user_id', req.user.id).update({ is_read: true });
        res.json({ code: 'SUCCESS', message: 'All notifications marked as read' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
