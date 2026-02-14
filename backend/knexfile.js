require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER_RUNTIME);

const serverlessPool = { min: 0, max: parseInt(process.env.DB_POOL_MAX || '2', 10) };
const defaultPool = { min: 2, max: parseInt(process.env.DB_POOL_MAX || '10', 10) };

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
        pool: defaultPool,
    },
    production: {
        client: 'pg',
        connection: (() => {
            // If DATABASE_URL is provided, use it. For serverless (Vercel) enable SSL by default.
            if (process.env.DATABASE_URL) {
                return {
                    connectionString: process.env.DATABASE_URL,
                    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
                };
            }
            // Fallback to individual env vars
            return {
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432', 10),
                user: process.env.DB_USER,
                database: process.env.DB_NAME,
                password: process.env.DB_PASSWORD,
                ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
            };
        })(),
        migrations: {
            directory: './migrations',
        },
        seeds: {
            directory: './seeds',
        },
        pool: isServerless ? serverlessPool : defaultPool,
    },
};
