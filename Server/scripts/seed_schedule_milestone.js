const pool = require('../db');

async function seed() {
    try {
        console.log('Seeding dedicated scheduling milestone...');
        
        const name = 'INTERNAL EXAM 1 SCHEDULE DETAILS (MID-1)';
        const start = '2024-08-01 09:00:00';
        const end = '2024-08-05 17:00:00';
        
        // Remove any previous ones if they exist
        await pool.query("DELETE FROM academic_milestones WHERE name = $1", [name]);
        
        await pool.query(`
            INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type)
            VALUES ($1, $2, $3, 'COLLEGE', 'Internal')
        `, [name, start, end]);

        console.log('Successfully added dedicated scheduling milestone: ' + name);
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        pool.end();
    }
}
seed();

