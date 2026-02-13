/**
 * Kairo Services — Initial schema migration
 */
exports.up = async function (knex) {
  // Enable uuid-ossp extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Users table
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name').notNullable();
    t.string('email').unique().notNullable();
    t.text('password_hash').notNullable();
    t.boolean('is_verified').defaultTo(false);
    t.enu('role', ['customer', 'vendor', 'admin']).notNullable().defaultTo('customer');
    t.string('photo_url');
    t.string('phone');
    t.boolean('is_blocked').defaultTo(false);
    t.boolean('is_online').defaultTo(false);
    t.boolean('analytics_opt_in').defaultTo(false);
    t.float('lat');
    t.float('lng');
    t.string('locality');
    t.string('city');
    t.timestamp('last_login', { useTz: true });
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_users_email ON users(email)');
  await knex.raw('CREATE INDEX idx_users_role ON users(role)');

  // OTPs table
  await knex.schema.createTable('otps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('email').notNullable();
    t.text('otp_hash').notNullable();
    t.enu('purpose', ['registration', 'login', 'booking_verify']).defaultTo('registration');
    t.integer('attempts').defaultTo(0);
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.boolean('used').defaultTo(false);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_otps_email ON otps(email)');

  // OTP throttle table
  await knex.schema.createTable('otp_throttle', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('email').notNullable();
    t.integer('send_count').defaultTo(1);
    t.timestamp('window_start', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Sessions / refresh tokens
  await knex.schema.createTable('sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.text('refresh_token_hash').notNullable();
    t.string('user_agent');
    t.string('ip');
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Categories
  await knex.schema.createTable('categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name').notNullable();
    t.string('slug').unique().notNullable();
    t.string('icon');
    t.text('description');
    t.integer('sort_order').defaultTo(0);
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Vendor profiles
  await knex.schema.createTable('vendor_profiles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').unique().references('id').inTable('users').onDelete('CASCADE');
    t.string('business_name');
    t.text('description');
    t.uuid('category_id').references('id').inTable('categories');
    t.boolean('is_verified').defaultTo(false);
    t.enu('kyc_status', ['pending', 'submitted', 'approved', 'rejected', 'resubmit']).defaultTo('pending');
    t.boolean('is_promoted').defaultTo(false);
    t.float('rating_avg').defaultTo(0);
    t.integer('rating_count').defaultTo(0);
    t.integer('service_radius_km').defaultTo(10);
    t.jsonb('availability_hours'); // {mon: {start, end}, ...}
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Vendor documents (KYC mock)
  await knex.schema.createTable('vendor_documents', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('vendor_id').references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.enu('doc_type', ['aadhaar_image', 'aadhaar_id', 'photo', 'other']).notNullable();
    t.text('doc_hash'); // hashed reference
    t.string('file_url'); // placeholder URL
    t.text('metadata'); // JSON string with metadata
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Services template
  await knex.schema.createTable('services', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name').notNullable();
    t.text('description');
    t.uuid('category_id').references('id').inTable('categories');
    t.string('icon');
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Vendor-specific services
  await knex.schema.createTable('vendor_services', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('vendor_id').references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.uuid('service_id').references('id').inTable('services').onDelete('CASCADE');
    t.decimal('base_price', 10, 2).notNullable();
    t.integer('duration_minutes').defaultTo(60);
    t.text('description');
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Addresses
  await knex.schema.createTable('addresses', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('label').notNullable(); // home, work, etc.
    t.text('line1').notNullable();
    t.text('line2');
    t.string('city').notNullable();
    t.string('state');
    t.string('pincode').notNullable();
    t.float('lat');
    t.float('lng');
    t.boolean('is_default').defaultTo(false);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_addresses_user ON addresses(user_id)');

  // Bookings
  await knex.schema.createTable('bookings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customer_id').references('id').inTable('users').onDelete('CASCADE');
    t.uuid('vendor_id').references('id').inTable('vendor_profiles').onDelete('CASCADE');
    t.uuid('service_id').references('id').inTable('vendor_services').onDelete('CASCADE');
    t.uuid('address_id').references('id').inTable('addresses');
    t.enu('status', [
      'requested', 'accepted', 'rejected', 'on_the_way', 'arrived',
      'in_progress', 'completed', 'cancelled',
    ]).defaultTo('requested');
    t.date('scheduled_date').notNullable();
    t.time('scheduled_time').notNullable();
    t.decimal('estimated_price', 10, 2);
    t.decimal('final_price', 10, 2);
    t.text('price_update_reason');
    t.decimal('travel_fee', 10, 2).defaultTo(0);
    t.decimal('tax', 10, 2).defaultTo(0);
    t.string('job_otp_hash'); // OTP for arrival verification
    t.boolean('job_otp_verified').defaultTo(false);
    t.decimal('cancellation_fee', 10, 2).defaultTo(0);
    t.text('cancellation_reason');
    t.uuid('cancelled_by');
    t.timestamp('accepted_at', { useTz: true });
    t.timestamp('completed_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_bookings_customer ON bookings(customer_id)');
  await knex.raw('CREATE INDEX idx_bookings_vendor ON bookings(vendor_id)');
  await knex.raw('CREATE INDEX idx_bookings_status ON bookings(status)');

  // Booking status history
  await knex.schema.createTable('booking_status_history', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    t.string('status').notNullable();
    t.uuid('changed_by').references('id').inTable('users');
    t.jsonb('meta');
    t.timestamp('changed_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Payments
  await knex.schema.createTable('payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    t.uuid('customer_id').references('id').inTable('users');
    t.uuid('vendor_id').references('id').inTable('vendor_profiles');
    t.decimal('amount', 10, 2).notNullable();
    t.enu('method', ['online_mock', 'cash']).defaultTo('cash');
    t.enu('status', ['pending', 'success', 'failed', 'refunded']).defaultTo('pending');
    t.string('transaction_ref');
    t.timestamp('paid_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Chats (one per booking)
  await knex.schema.createTable('chats', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').unique().references('id').inTable('bookings').onDelete('CASCADE');
    t.uuid('customer_id').references('id').inTable('users');
    t.uuid('vendor_user_id').references('id').inTable('users');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Messages
  await knex.schema.createTable('messages', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('chat_id').references('id').inTable('chats').onDelete('CASCADE');
    t.uuid('sender_id').references('id').inTable('users');
    t.text('content').notNullable();
    t.enu('msg_status', ['sent', 'delivered', 'seen']).defaultTo('sent');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_messages_chat ON messages(chat_id)');

  // Ratings
  await knex.schema.createTable('ratings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').unique().references('id').inTable('bookings').onDelete('CASCADE');
    t.uuid('customer_id').references('id').inTable('users');
    t.uuid('vendor_id').references('id').inTable('vendor_profiles');
    t.integer('score').notNullable(); // 1-5
    t.text('review');
    t.boolean('is_published').defaultTo(false); // published after 5 min delay
    t.timestamp('published_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Notifications
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.enu('type', [
      'booking_update', 'payment_alert', 'review_reminder',
      'vendor_update', 'system_alert', 'support_chat',
    ]).notNullable();
    t.string('title').notNullable();
    t.text('body');
    t.jsonb('data');
    t.boolean('is_read').defaultTo(false);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_notifications_user ON notifications(user_id)');

  // Admin actions audit
  await knex.schema.createTable('admin_actions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('admin_id').references('id').inTable('users');
    t.string('action').notNullable();
    t.string('target_type'); // user, vendor, booking
    t.uuid('target_id');
    t.jsonb('details');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  const tables = [
    'admin_actions', 'notifications', 'ratings', 'messages', 'chats',
    'payments', 'booking_status_history', 'bookings', 'addresses',
    'vendor_services', 'services', 'vendor_documents', 'vendor_profiles',
    'categories', 'sessions', 'otp_throttle', 'otps', 'users',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
};
