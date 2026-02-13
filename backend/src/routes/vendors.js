const router = require('express').Router();
const db = require('../utils/db');
const { authenticate, authorize } = require('../utils/middleware');
const { query, param, validate } = require('../utils/validation');

// GET /api/vendors — list vendors with optional geo/category filter
router.get('/', async (req, res, next) => {
    try {
        const { lat, lng, radius = 10, category, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let q = db('vendor_profiles as vp')
            .join('users as u', 'u.id', 'vp.user_id')
            .leftJoin('categories as c', 'c.id', 'vp.category_id')
            .select(
                'vp.id', 'vp.user_id', 'vp.business_name', 'vp.description',
                'vp.is_verified', 'vp.kyc_status', 'vp.is_promoted', 'vp.rating_avg',
                'vp.rating_count', 'vp.service_radius_km', 'vp.availability_hours',
                'u.name', 'u.photo_url', 'u.is_online', 'u.lat', 'u.lng', 'u.locality', 'u.city',
                'c.name as category_name', 'c.slug as category_slug', 'c.icon as category_icon'
            )
            .where('u.is_blocked', false)
            .where('u.is_verified', true);

        if (category) {
            q = q.where('c.slug', category);
        }

        if (search) {
            q = q.where(function () {
                this.whereILike('vp.business_name', `%${search}%`)
                    .orWhereILike('u.name', `%${search}%`)
                    .orWhereILike('vp.description', `%${search}%`);
            });
        }

        // Simple distance filter using lat/lng (Haversine approximation)
        if (lat && lng) {
            const earthRadius = 6371; // km
            const distanceFormula = `(${earthRadius} * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(${parseFloat(lat)})) * cos(radians(u.lat)) *
                    cos(radians(u.lng) - radians(${parseFloat(lng)})) +
                    sin(radians(${parseFloat(lat)})) * sin(radians(u.lat))
                ))
            ))`;

            q = q.select(db.raw(`${distanceFormula} as distance`))
                .whereNotNull('u.lat')
                .whereNotNull('u.lng')
                .whereRaw(`${distanceFormula} <= ?`, [radius])
                .orderByRaw(`${distanceFormula} asc`);
        }

        q = q.orderBy('vp.is_promoted', 'desc').orderBy('vp.rating_avg', 'desc');

        const vendors = await q.offset(offset).limit(limit);
        const [{ count }] = await db('vendor_profiles as vp')
            .join('users as u', 'u.id', 'vp.user_id')
            .where('u.is_blocked', false)
            .where('u.is_verified', true)
            .count();

        res.json({
            code: 'SUCCESS',
            data: vendors,
            meta: { total: parseInt(count), page: parseInt(page), limit: parseInt(limit) },
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/vendors/categories
router.get('/categories', async (req, res, next) => {
    try {
        const categories = await db('categories').where('is_active', true).orderBy('sort_order');
        res.json({ code: 'SUCCESS', data: categories });
    } catch (err) {
        next(err);
    }
});

// GET /api/vendors/promoted
router.get('/promoted', async (req, res, next) => {
    try {
        const promoted = await db('vendor_profiles as vp')
            .join('users as u', 'u.id', 'vp.user_id')
            .leftJoin('categories as c', 'c.id', 'vp.category_id')
            .select(
                'vp.id', 'vp.business_name', 'vp.rating_avg', 'vp.rating_count',
                'u.name', 'u.photo_url', 'u.is_online',
                'c.name as category_name', 'c.icon as category_icon'
            )
            .where('vp.is_promoted', true)
            .where('u.is_verified', true)
            .where('u.is_blocked', false)
            .limit(10);
        res.json({ code: 'SUCCESS', data: promoted });
    } catch (err) {
        next(err);
    }
});

// GET /api/vendors/geocode/reverse — reverse geocoding proxy
router.get('/geocode/reverse', async (req, res, next) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ code: 'INVALID_INPUT', message: 'lat and lng required' });
        }

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
            {
                headers: {
                    'User-Agent': 'Kairo-App/1.0',
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({
                code: 'GEOCODE_ERROR',
                message: 'Failed to fetch location data'
            });
        }

        const data = await response.json();
        res.json({ code: 'SUCCESS', data });
    } catch (err) {
        next(err);
    }
});

// GET /api/vendors/:id — single vendor profile + services
router.get('/:id', async (req, res, next) => {
    try {
        const vendorId = req.params.id;
        console.log(`[vendors] Looking up vendor with ID: ${vendorId}`);

        const vendor = await db('vendor_profiles as vp')
            .join('users as u', 'u.id', 'vp.user_id')
            .leftJoin('categories as c', 'c.id', 'vp.category_id')
            .select(
                'vp.*', 'u.name', 'u.email', 'u.photo_url', 'u.is_online',
                'u.lat', 'u.lng', 'u.locality', 'u.city',
                'c.name as category_name', 'c.slug as category_slug'
            )
            .where('vp.id', vendorId)
            .first();

        if (!vendor) {
            console.log(`[vendors] Vendor not found for ID: ${vendorId}`);
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Vendor not found' });
        }

        console.log(`[vendors] Found vendor: ${vendor.business_name}`);

        const services = await db('vendor_services as vs')
            .join('services as s', 's.id', 'vs.service_id')
            .select('vs.*', 's.name as service_name', 's.description as service_description', 's.icon')
            .where('vs.vendor_id', vendor.id)
            .where('vs.is_active', true);

        const reviews = await db('ratings')
            .join('users', 'users.id', 'ratings.customer_id')
            .select('ratings.*', 'users.name as customer_name')
            .where('ratings.vendor_id', vendor.id)
            .where('ratings.is_published', true)
            .orderBy('ratings.created_at', 'desc')
            .limit(20);

        res.json({
            code: 'SUCCESS',
            data: { ...vendor, services, reviews },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
