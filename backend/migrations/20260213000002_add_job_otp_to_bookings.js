exports.up = async function up(knex) {
    await knex.schema.alterTable('bookings', (t) => {
        t.string('job_otp');
    });
};

exports.down = async function down(knex) {
    await knex.schema.alterTable('bookings', (t) => {
        t.dropColumn('job_otp');
    });
};
