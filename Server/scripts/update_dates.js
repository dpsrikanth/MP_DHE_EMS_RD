const pool = require('../db');

async function run() {
    try {
        await pool.query("UPDATE academic_milestones SET start_date = '2026-04-20', end_date = '2026-04-30' WHERE name = 'INTERNAL EXAM 1 (MID-1)'");
        await pool.query("UPDATE academic_milestones SET start_date = '2026-04-01', end_date = '2026-05-05' WHERE name = 'INTERNAL EXAM 1 SCHEDULE DETAILS (MID-1)'");
        console.log('Dates updated for 2026');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

