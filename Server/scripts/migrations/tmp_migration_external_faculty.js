const client = require('../../Server/db');

async function migrate() {
    try {
        await client.query('BEGIN');

        // 1. Add External Faculty role
        console.log("Adding 'External Faculty' role...");
        await client.query(`
            INSERT INTO roles (role_name) 
            VALUES ('External Faculty') 
            ON CONFLICT (role_name) DO NOTHING
        `);

        // 2. Create external_faculty_assignments table
        console.log("Creating 'external_faculty_assignments' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS external_faculty_assignments (
                id SERIAL PRIMARY KEY,
                faculty_user_id INTEGER REFERENCES users(id),
                registration_id INTEGER REFERENCES exam_registrations(id),
                assigned_by INTEGER REFERENCES users(id),
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'Assigned'
            )
        `);

        await client.query('COMMIT');
        console.log("Database migration successful.");
        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
