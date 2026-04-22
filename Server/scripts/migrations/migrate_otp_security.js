const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        user: 'postgres',
        host: '172.16.0.225',
        database: 'emsdb',
        password: '!ntense@225',
        port: 5432,
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log("Connecting manually to run migration...");
        await client.connect();
        console.log("Connected! Running migration SQL...");
        
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS otp VARCHAR(6),
            ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP,
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
        `);

        // Marking existing users as verified so login works immediately
        await client.query(`
            UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL;
        `);

        console.log("Migration completed successfully. Columns added.");
        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
