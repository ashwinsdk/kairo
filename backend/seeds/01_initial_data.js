const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
    // Clean existing data in reverse dependency order
    await knex('admin_actions').del();
    await knex('notifications').del();
    await knex('ratings').del();
    await knex('messages').del();
    await knex('chats').del();
    await knex('payments').del();
    await knex('booking_status_history').del();
    await knex('bookings').del();
    await knex('addresses').del();
    await knex('vendor_services').del();
    await knex('services').del();
    await knex('vendor_documents').del();
    await knex('vendor_profiles').del();
    await knex('categories').del();
    await knex('sessions').del();
    await knex('otp_throttle').del();
    await knex('otps').del();
    await knex('users').del();

    const passwordHash = await bcrypt.hash('Password123', 12);

    // --- Admin ---
    const [admin] = await knex('users').insert({
        name: 'Kairo Admin',
        email: 'admin@kairo.local',
        password_hash: passwordHash,
        is_verified: true,
        role: 'admin',
    }).returning('*');

    // --- Categories ---
    const categories = await knex('categories').insert([
        { name: 'Plumbing', slug: 'plumbing', icon: 'wrench', sort_order: 1 },
        { name: 'Electrical', slug: 'electrical', icon: 'zap', sort_order: 2 },
        { name: 'Carpentry', slug: 'carpentry', icon: 'hammer', sort_order: 3 },
        { name: 'Cleaning', slug: 'cleaning', icon: 'sparkles', sort_order: 4 },
        { name: 'Home Bakery', slug: 'bakery', icon: 'cake', sort_order: 5 },
        { name: 'Grocery', slug: 'grocery', icon: 'shopping-cart', sort_order: 6 },
        { name: 'Internet Provider', slug: 'internet', icon: 'wifi', sort_order: 7 },
        { name: 'Painting', slug: 'painting', icon: 'paintbrush', sort_order: 8 },
        { name: 'AC Repair', slug: 'ac-repair', icon: 'thermometer', sort_order: 9 },
        { name: 'Pest Control', slug: 'pest-control', icon: 'bug', sort_order: 10 },
    ]).returning('*');

    // --- Services (templates) ---
    const services = await knex('services').insert([
        { name: 'Pipe Repair', description: 'Fix leaking or broken pipes', category_id: categories[0].id, icon: 'wrench' },
        { name: 'Drain Cleaning', description: 'Unclog and clean drains', category_id: categories[0].id, icon: 'wrench' },
        { name: 'Wiring Repair', description: 'Electrical wiring fix and replacement', category_id: categories[1].id, icon: 'zap' },
        { name: 'Fan Installation', description: 'Ceiling and exhaust fan installation', category_id: categories[1].id, icon: 'zap' },
        { name: 'Furniture Repair', description: 'Repair and restore wood furniture', category_id: categories[2].id, icon: 'hammer' },
        { name: 'Custom Shelving', description: 'Build custom shelves and storage', category_id: categories[2].id, icon: 'hammer' },
        { name: 'Deep Cleaning', description: 'Full home deep cleaning', category_id: categories[3].id, icon: 'sparkles' },
        { name: 'Kitchen Cleaning', description: 'Kitchen deep clean and sanitize', category_id: categories[3].id, icon: 'sparkles' },
        { name: 'Custom Cakes', description: 'Custom cakes for birthdays and events', category_id: categories[4].id, icon: 'cake' },
        { name: 'Monthly Groceries', description: 'Monthly grocery delivery package', category_id: categories[5].id, icon: 'shopping-cart' },
        { name: 'Broadband Setup', description: 'Local broadband connection and setup', category_id: categories[6].id, icon: 'wifi' },
        { name: 'Interior Painting', description: 'Room and house interior painting', category_id: categories[7].id, icon: 'paintbrush' },
        { name: 'AC Service', description: 'AC cleaning and gas refill', category_id: categories[8].id, icon: 'thermometer' },
        { name: 'Termite Treatment', description: 'Termite and pest treatment', category_id: categories[9].id, icon: 'bug' },
    ]).returning('*');

    // --- Vendors (Tiruchengode, Tamil Nadu 637205) ---
    const vendorUsers = await knex('users').insert([
        { name: 'Kumar Plumbing', email: 'kumar@kairo.local', password_hash: passwordHash, is_verified: true, role: 'vendor', is_online: true, lat: 11.3979, lng: 77.8983, locality: 'Tiruchengode Main', city: 'Tiruchengode' },
        { name: 'Selvaraj Electricals', email: 'selva@kairo.local', password_hash: passwordHash, is_verified: true, role: 'vendor', is_online: true, lat: 11.4012, lng: 77.9021, locality: 'Erode Road', city: 'Tiruchengode' },
        { name: 'Murugan Wood Works', email: 'murugan@kairo.local', password_hash: passwordHash, is_verified: true, role: 'vendor', is_online: false, lat: 11.3945, lng: 77.8956, locality: 'Sankagiri Road', city: 'Tiruchengode' },
        { name: 'Lakshmi Cleaning Services', email: 'lakshmi@kairo.local', password_hash: passwordHash, is_verified: true, role: 'vendor', is_online: true, lat: 11.4001, lng: 77.8997, locality: 'Bus Stand Area', city: 'Tiruchengode' },
        { name: 'Priya Home Bakery', email: 'priya@kairo.local', password_hash: passwordHash, is_verified: true, role: 'vendor', is_online: true, lat: 11.3968, lng: 77.8975, locality: 'College Road', city: 'Tiruchengode' },
        { name: 'Raja AC & Appliances', email: 'raja@kairo.local', password_hash: passwordHash, is_verified: true, role: 'vendor', is_online: true, lat: 11.4025, lng: 77.9008, locality: 'Namakkal Road', city: 'Tiruchengode' },
        { name: 'Anand Painters', email: 'anand@kairo.local', password_hash: passwordHash, is_verified: true, role: 'vendor', is_online: false, lat: 11.3987, lng: 77.8992, locality: 'Gandhi Nagar', city: 'Tiruchengode' },
        { name: 'Senthil Pest Control', email: 'senthil@kairo.local', password_hash: passwordHash, is_verified: true, role: 'vendor', is_online: true, lat: 11.3956, lng: 77.8969, locality: 'KSR Nagar', city: 'Tiruchengode' },
    ]).returning('*');

    const vendorProfiles = await knex('vendor_profiles').insert([
        { user_id: vendorUsers[0].id, business_name: 'Kumar Plumbing Solutions', description: '20+ years experience in all plumbing work - residential and commercial', category_id: categories[0].id, is_verified: true, kyc_status: 'approved', is_promoted: true, rating_avg: 4.6, rating_count: 142, service_radius_km: 12 },
        { user_id: vendorUsers[1].id, business_name: 'Selvaraj Electrical Works', description: 'Licensed electrician - house wiring, motor repair, panel installation', category_id: categories[1].id, is_verified: true, kyc_status: 'approved', is_promoted: true, rating_avg: 4.8, rating_count: 98, service_radius_km: 15 },
        { user_id: vendorUsers[2].id, business_name: 'Murugan Wood Works', description: 'Custom furniture, door/window frames, interior woodwork', category_id: categories[2].id, is_verified: true, kyc_status: 'approved', is_promoted: false, rating_avg: 4.4, rating_count: 73, service_radius_km: 10 },
        { user_id: vendorUsers[3].id, business_name: 'Lakshmi Cleaning Services', description: 'Professional home & office cleaning, deep cleaning, sanitization', category_id: categories[3].id, is_verified: true, kyc_status: 'approved', is_promoted: true, rating_avg: 4.9, rating_count: 186, service_radius_km: 8 },
        { user_id: vendorUsers[4].id, business_name: 'Priya Home Bakery', description: 'Fresh cakes, cookies, snacks - order 1 day advance', category_id: categories[4].id, is_verified: true, kyc_status: 'approved', is_promoted: false, rating_avg: 4.7, rating_count: 62, service_radius_km: 5 },
        { user_id: vendorUsers[5].id, business_name: 'Raja AC & Appliance Repair', description: 'AC servicing, fridge repair, washing machine, all home appliances', category_id: categories[8].id, is_verified: true, kyc_status: 'approved', is_promoted: true, rating_avg: 4.5, rating_count: 119, service_radius_km: 20 },
        { user_id: vendorUsers[6].id, business_name: 'Anand Painting Contractors', description: 'Interior & exterior painting, waterproofing, texture work', category_id: categories[7].id, is_verified: true, kyc_status: 'approved', is_promoted: false, rating_avg: 4.3, rating_count: 54, service_radius_km: 15 },
        { user_id: vendorUsers[7].id, business_name: 'Senthil Pest Control', description: 'Termite treatment, cockroach, rat, ant control - safe chemicals', category_id: categories[9].id, is_verified: true, kyc_status: 'approved', is_promoted: false, rating_avg: 4.6, rating_count: 89, service_radius_km: 25 },
    ]).returning('*');

    // --- Vendor Services ---
    await knex('vendor_services').insert([
        // Kumar Plumbing
        { vendor_id: vendorProfiles[0].id, service_id: services[0].id, base_price: 250, duration_minutes: 60, description: 'Pipe leakage repair - all types of pipes', is_active: true },
        { vendor_id: vendorProfiles[0].id, service_id: services[1].id, base_price: 400, duration_minutes: 90, description: 'Drain cleaning with machine and chemicals', is_active: true },
        // Selvaraj Electrical
        { vendor_id: vendorProfiles[1].id, service_id: services[2].id, base_price: 350, duration_minutes: 45, description: 'House wiring repair and replacement', is_active: true },
        { vendor_id: vendorProfiles[1].id, service_id: services[3].id, base_price: 300, duration_minutes: 30, description: 'Ceiling fan installation with regulator', is_active: true },
        // Murugan Wood Works
        { vendor_id: vendorProfiles[2].id, service_id: services[4].id, base_price: 500, duration_minutes: 120, description: 'Furniture repair, polishing, restoration', is_active: true },
        { vendor_id: vendorProfiles[2].id, service_id: services[5].id, base_price: 2000, duration_minutes: 480, description: 'Custom shelves and storage units', is_active: true },
        // Lakshmi Cleaning
        { vendor_id: vendorProfiles[3].id, service_id: services[6].id, base_price: 1200, duration_minutes: 180, description: 'Full home deep cleaning with equipment', is_active: true },
        { vendor_id: vendorProfiles[3].id, service_id: services[7].id, base_price: 600, duration_minutes: 90, description: 'Kitchen complete cleaning and sanitization', is_active: true },
        // Priya Bakery
        { vendor_id: vendorProfiles[4].id, service_id: services[8].id, base_price: 800, duration_minutes: 1440, description: 'Custom birthday/celebration cakes - 1 day advance order', is_active: true },
        // Raja AC & Appliances
        { vendor_id: vendorProfiles[5].id, service_id: services[12].id, base_price: 500, duration_minutes: 60, description: 'AC gas filling, cleaning, service', is_active: true },
        // Anand Painters
        { vendor_id: vendorProfiles[6].id, service_id: services[11].id, base_price: 3500, duration_minutes: 480, description: 'Interior painting per room - Asian Paints', is_active: true },
        // Senthil Pest Control
        { vendor_id: vendorProfiles[7].id, service_id: services[13].id, base_price: 1500, duration_minutes: 120, description: 'Full house termite and pest treatment', is_active: true },
    ]);

    // --- Sample Customer (Tiruchengode) ---
    const [customer] = await knex('users').insert({
        name: 'Ashwin Sudhakar',
        email: 'ashwin@kairo.local',
        password_hash: passwordHash,
        is_verified: true,
        role: 'customer',
        lat: 11.3979,
        lng: 77.8983,
        locality: 'Tiruchengode Main',
        city: 'Tiruchengode',
    }).returning('*');

    // --- Customer Addresses ---
    await knex('addresses').insert([
        { user_id: customer.id, label: 'Home', line1: '12, Erode Road', city: 'Tiruchengode', state: 'Tamil Nadu', pincode: '637205', lat: 11.3979, lng: 77.8983, is_default: true },
        { user_id: customer.id, label: 'Work', line1: '45, Sankagiri Road', city: 'Tiruchengode', state: 'Tamil Nadu', pincode: '637205', lat: 11.3956, lng: 77.8969, is_default: false },
    ]);

    console.log('Seed data inserted successfully (Tiruchengode-637205).');
    console.log('Test accounts:');
    console.log('  Admin:    admin@kairo.local / Password123');
    console.log('  Customer: ashwin@kairo.local / Password123');
    console.log('  Vendor:   kumar@kairo.local / Password123');
};
