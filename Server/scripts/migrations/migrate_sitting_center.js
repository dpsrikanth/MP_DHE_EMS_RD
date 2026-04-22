const pool = require('../../db');

const migrate = async () => {
    try {
        console.log('Starting migration to add sitting_center_id...');
        const query = `
            ALTER TABLE colleges 
            ADD COLUMN IF NOT EXISTS sitting_center_id INTEGER REFERENCES colleges(id);
        `;
        await pool.query(query);
        console.log('Migration successful: sitting_center_id column added to colleges.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
