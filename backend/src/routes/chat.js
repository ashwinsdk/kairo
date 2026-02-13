const router = require('express').Router();
const db = require('../utils/db');
const { authenticate } = require('../utils/middleware');

// GET /api/chat/:bookingId — get chat messages
router.get('/:bookingId', authenticate, async (req, res, next) => {
    try {
        const chat = await db('chats').where('booking_id', req.params.bookingId).first();
        if (!chat) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Chat not found' });
        }

        // Verify user is part of this chat
        if (chat.customer_id !== req.user.id && chat.vendor_user_id !== req.user.id) {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Not authorized for this chat' });
        }

        const messages = await db('messages')
            .where('chat_id', chat.id)
            .orderBy('created_at', 'asc');

        // Mark messages as seen
        await db('messages')
            .where('chat_id', chat.id)
            .whereNot('sender_id', req.user.id)
            .where('msg_status', '!=', 'seen')
            .update({ msg_status: 'seen' });

        // Get other user's online status
        const otherUserId = chat.customer_id === req.user.id ? chat.vendor_user_id : chat.customer_id;
        const otherUser = await db('users').select('name', 'is_online', 'photo_url').where('id', otherUserId).first();

        res.json({
            code: 'SUCCESS',
            data: { chat, messages, otherUser },
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/chat/:bookingId/messages — send message
router.post('/:bookingId/messages', authenticate, async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content?.trim()) {
            return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Message content is required' });
        }

        const chat = await db('chats').where('booking_id', req.params.bookingId).first();
        if (!chat) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Chat not found' });
        }

        if (chat.customer_id !== req.user.id && chat.vendor_user_id !== req.user.id) {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Not authorized to send messages' });
        }

        const [message] = await db('messages').insert({
            chat_id: chat.id,
            sender_id: req.user.id,
            content: content.trim(),
        }).returning('*');

        // Notify other user
        const notifyUserId = chat.customer_id === req.user.id ? chat.vendor_user_id : chat.customer_id;
        await db('notifications').insert({
            user_id: notifyUserId,
            type: 'support_chat',
            title: 'New Message',
            body: content.substring(0, 100),
            data: JSON.stringify({ booking_id: req.params.bookingId, chat_id: chat.id }),
        });

        res.status(201).json({ code: 'MESSAGE_SENT', data: message });
    } catch (err) {
        next(err);
    }
});

// GET /api/chat/:bookingId/poll — polling endpoint for new messages
router.get('/:bookingId/poll', authenticate, async (req, res, next) => {
    try {
        const { since } = req.query; // ISO timestamp
        const chat = await db('chats').where('booking_id', req.params.bookingId).first();
        if (!chat) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Chat not found' });
        }

        let q = db('messages').where('chat_id', chat.id);
        if (since) {
            q = q.where('created_at', '>', since);
        }

        const messages = await q.orderBy('created_at', 'asc');
        res.json({ code: 'SUCCESS', data: messages });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
