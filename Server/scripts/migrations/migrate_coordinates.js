const pool = require('../../db');

const migrate = async () => {
    try {
        console.log('Adding latitude and longitude to colleges table...');
        const query = `
            ALTER TABLE colleges 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
        `;
        await pool.query(query);

        // Seed some coordinates for testing (Assuming sample colleges exist)
        console.log('Seeding sample coordinates for demonstration...');
        
        // Let's seed MP college (ID 1 probably) and some others
        // Indore Area: 22.7196, 75.8577
        await pool.query('UPDATE colleges SET latitude = 22.7196, longitude = 75.8577 WHERE id = 1');
        
        // Nearby college 1: 22.7500, 75.8800 (~5km)
        await pool.query('UPDATE colleges SET latitude = 22.7500, longitude = 75.8800 WHERE id = 2');
        
        // Nearby college 2: 22.8000, 75.9000 (~15km)
        await pool.query('UPDATE colleges SET latitude = 22.8000, longitude = 75.9000 WHERE id = 3');

        // Far college: 23.2599, 77.4126 (Bhopal, ~170km)
        await pool.query('UPDATE colleges SET latitude = 23.2599, longitude = 77.4126 WHERE id = 4');

        console.log('Migration and seeding successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
