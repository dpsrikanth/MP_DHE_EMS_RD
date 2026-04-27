const pool = require('../db');

async function run() {
    try {
        await pool.query("UPDATE academic_milestones SET start_date = '2026-04-20', end_date = '2026-04-30' WHERE id = 2");
        console.log('Exam milestone ID 2 dates updated for 2026');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

