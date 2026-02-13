const router = require('express').Router();
const db = require('../utils/db');
const { authenticate } = require('../utils/middleware');
const { addressRules, validate, body } = require('../utils/validation');

// GET /api/profile — get current user profile
router.get('/', authenticate, async (req, res, next) => {
    try {
        const user = await db('users')
            .select('id', 'name', 'email', 'role', 'is_verified', 'photo_url', 'phone', 'lat', 'lng', 'locality', 'city', 'analytics_opt_in', 'created_at')
            .where('id', req.user.id)
            .first();

        let vendorProfile = null;
        if (user.role === 'vendor') {
            vendorProfile = await db('vendor_profiles').where('user_id', user.id).first();
        }

        res.json({ code: 'SUCCESS', data: { ...user, vendor_profile: vendorProfile } });
    } catch (err) {
        next(err);
    }
});

// PUT /api/profile — update profile
router.put('/', authenticate, async (req, res, next) => {
    try {
        const { name, phone, photo_url, lat, lng, locality, city, analytics_opt_in } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (photo_url !== undefined) updates.photo_url = photo_url;
        if (lat !== undefined) updates.lat = lat;
        if (lng !== undefined) updates.lng = lng;
        if (locality !== undefined) updates.locality = locality;
        if (city !== undefined) updates.city = city;
        if (analytics_opt_in !== undefined) updates.analytics_opt_in = analytics_opt_in;
        updates.updated_at = new Date();

        const [user] = await db('users').where('id', req.user.id).update(updates).returning('*');
        res.json({ code: 'SUCCESS', data: user });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/profile/location — update user location quickly
router.patch('/location', authenticate, async (req, res, next) => {
    try {
        const { lat, lng } = req.body;
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ code: 'INVALID_INPUT', message: 'lat and lng required' });
        }

        await db('users').where('id', req.user.id).update({ lat, lng, updated_at: new Date() });
        res.json({ code: 'LOCATION_UPDATED' });
    } catch (err) {
        next(err);
    }
});

// PUT /api/profile/vendor — update vendor profile
router.put('/vendor', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Vendor only' });
        }

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

        const { business_name, description, category_id, service_radius_km, availability_hours, is_online } = req.body;
        const updates = {};
        if (business_name) updates.business_name = business_name;
        if (description !== undefined) updates.description = description;
        if (category_id) updates.category_id = category_id;
        if (service_radius_km) updates.service_radius_km = service_radius_km;
        if (availability_hours) updates.availability_hours = JSON.stringify(availability_hours);
        updates.updated_at = new Date();

        if (is_online !== undefined) {
            await db('users').where('id', req.user.id).update({ is_online });
        }

        const [profile] = await db('vendor_profiles')
            .where('user_id', req.user.id)
            .update(updates)
            .returning('*');

        res.json({ code: 'SUCCESS', data: profile });
    } catch (err) {
        next(err);
    }
});

// POST /api/profile/vendor/documents — upload KYC documents (mock)
router.post('/vendor/documents', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Vendor only' });
        }

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

        const { doc_type, file_url, aadhaar_id_hash } = req.body;
        const crypto = require('crypto');

        // Map doc_type to valid enum values: ['aadhaar_image', 'aadhaar_id', 'photo', 'other']
        const docTypeMap = {
            'aadhaar': 'aadhaar_id',
            'pan': 'photo',
            'license': 'photo',
        };
        const mappedDocType = docTypeMap[doc_type] || 'other';

        const [doc] = await db('vendor_documents').insert({
            vendor_id: vendorProfile.id,
            doc_type: mappedDocType,
            doc_hash: aadhaar_id_hash || crypto.createHash('sha256').update(file_url || 'mock').digest('hex'),
            file_url: file_url || 'mock://placeholder',
            metadata: JSON.stringify({ uploaded_by: req.user.id, mock: process.env.MOCK_KYC === 'true' }),
        }).returning('*');

        // Update KYC status to submitted
        await db('vendor_profiles').where('id', vendorProfile.id).update({ kyc_status: 'submitted' });

        res.status(201).json({ code: 'DOCUMENT_UPLOADED', data: doc });
    } catch (err) {
        next(err);
    }
});

// --- Address Management ---
// GET /api/profile/addresses
router.get('/addresses', authenticate, async (req, res, next) => {
    try {
        const addresses = await db('addresses').where('user_id', req.user.id).orderBy('is_default', 'desc');
        res.json({ code: 'SUCCESS', data: addresses });
    } catch (err) {
        next(err);
    }
});

// POST /api/profile/addresses
router.post('/addresses', authenticate, addressRules, validate, async (req, res, next) => {
    try {
        // Limit to 4 addresses
        const [{ count }] = await db('addresses').where('user_id', req.user.id).count();
        if (parseInt(count) >= 4) {
            return res.status(400).json({ code: 'LIMIT_REACHED', message: 'Maximum 4 addresses allowed.' });
        }

        const { label, line1, line2, city, state, pincode, lat, lng, is_default } = req.body;

        if (is_default) {
            await db('addresses').where('user_id', req.user.id).update({ is_default: false });
        }

        const [address] = await db('addresses').insert({
            user_id: req.user.id,
            label, line1, line2, city, state, pincode, lat, lng,
            is_default: is_default || false,
        }).returning('*');

        res.status(201).json({ code: 'ADDRESS_CREATED', data: address });
    } catch (err) {
        next(err);
    }
});

// PUT /api/profile/addresses/:id
router.put('/addresses/:id', authenticate, async (req, res, next) => {
    try {
        const { label, line1, line2, city, state, pincode, lat, lng, is_default } = req.body;
        const updates = {};
        if (label) updates.label = label;
        if (line1) updates.line1 = line1;
        if (line2 !== undefined) updates.line2 = line2;
        if (city) updates.city = city;
        if (state !== undefined) updates.state = state;
        if (pincode) updates.pincode = pincode;
        if (lat !== undefined) updates.lat = lat;
        if (lng !== undefined) updates.lng = lng;

        if (is_default) {
            await db('addresses').where('user_id', req.user.id).update({ is_default: false });
            updates.is_default = true;
        }

        const [address] = await db('addresses')
            .where('id', req.params.id)
            .where('user_id', req.user.id)
            .update(updates)
            .returning('*');

        if (!address) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Address not found' });
        }

        res.json({ code: 'SUCCESS', data: address });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/profile/addresses/:id
router.delete('/addresses/:id', authenticate, async (req, res, next) => {
    try {
        const deleted = await db('addresses')
            .where('id', req.params.id)
            .where('user_id', req.user.id)
            .del();

        if (!deleted) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Address not found' });
        }

        res.json({ code: 'DELETED', message: 'Address deleted.' });
    } catch (err) {
        next(err);
    }
});

// POST /api/profile/vendor/services — add service to vendor
router.post('/vendor/services', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Vendor only' });
        }

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

        const { service_id, category_id, name, base_price, duration_minutes, description } = req.body;

        // If service_id provided, use existing service template
        // Otherwise create a custom service entry
        let finalServiceId = service_id;

        if (!service_id && name && category_id) {
            // Create a custom service entry (not a template)
            const [newService] = await db('services').insert({
                name,
                description: description || name,
                category_id,
                icon: 'tool',
            }).returning('*');
            finalServiceId = newService.id;
        }

        if (!finalServiceId) {
            return res.status(400).json({ code: 'INVALID_INPUT', message: 'Provide either service_id or (name + category_id)' });
        }

        const [vs] = await db('vendor_services').insert({
            vendor_id: vendorProfile.id,
            service_id: finalServiceId,
            base_price,
            duration_minutes: duration_minutes || 60,
            description,
            is_active: true,
        }).returning('*');

        res.status(201).json({ code: 'SERVICE_ADDED', data: vs });
    } catch (err) {
        next(err);
    }
});

// GET /api/profile/vendor/services — get vendor's services
router.get('/vendor/services', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Vendor only' });
        }

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

        const services = await db('vendor_services as vs')
            .join('services as s', 's.id', 'vs.service_id')
            .leftJoin('categories as c', 'c.id', 's.category_id')
            .where('vs.vendor_id', vendorProfile.id)
            .select(
                'vs.id', 'vs.base_price', 'vs.duration_minutes',
                'vs.description', 'vs.is_active',
                's.name as service_name', 's.icon',
                'c.name as category_name'
            )
            .orderBy('vs.created_at', 'desc');

        res.json({ code: 'SUCCESS', data: services });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/profile/vendor/services/:id — update vendor service
router.patch('/vendor/services/:id', authenticate, async (req, res, next) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Vendor only' });
        }

        const vendorProfile = await db('vendor_profiles').where('user_id', req.user.id).first();
        if (!vendorProfile) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Vendor profile not found' });
        }

        const { base_price, custom_price, duration_minutes, description, is_active } = req.body;
        const updates = {};
        if (base_price !== undefined) updates.base_price = base_price;
        if (custom_price !== undefined) updates.custom_price = custom_price;
        if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
        if (description !== undefined) updates.description = description;
        if (is_active !== undefined) updates.is_active = is_active;
        updates.updated_at = new Date();

        const [updated] = await db('vendor_services')
            .where('id', req.params.id)
            .where('vendor_id', vendorProfile.id)
            .update(updates)
            .returning('*');

        if (!updated) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Service not found' });
        }

        res.json({ code: 'SERVICE_UPDATED', data: updated });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

