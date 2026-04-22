const pool = require('../../db');

const migrate = async () => {
    try {
        console.log('Starting migration to add allocated_college_id...');
        const query = `
            ALTER TABLE shortage_requests 
            ADD COLUMN IF NOT EXISTS allocated_college_id INTEGER REFERENCES colleges(id);
        `;
        await pool.query(query);
        console.log('Migration successful: allocated_college_id column added to shortage_requests.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
