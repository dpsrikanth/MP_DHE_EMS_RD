const pool = require('../db');

async function run() {
    try {
        await pool.query("UPDATE academic_milestones SET start_date = '2024-08-01 00:00:00', end_date = '2024-08-05 23:59:59' WHERE name = 'INTERNAL EXAM 1 SCHEDULE DETAILS (MID-1)'");
        console.log('Exam schedule milestone dates updated to 2024');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

