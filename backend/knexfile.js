require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
    development: {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER || 'kairo_postgres',
            database: process.env.DB_NAME || 'kairo',
            password: process.env.DB_PASSWORD || undefined,
        },
        migrations: {
            directory: './migrations',
        },
        seeds: {
            directory: './seeds',
        },
        pool: { min: 2, max: 10 },
    },
    production: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        migrations: {
            directory: './migrations',
        },
        seeds: {
            directory: './seeds',
        },
        pool: { min: 2, max: 10 },
    },
};
