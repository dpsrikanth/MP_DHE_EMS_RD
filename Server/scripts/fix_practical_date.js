const pool = require('../db');
async function run() {
    try {
        await pool.query(
            "UPDATE academic_milestones SET start_date = '2024-10-25 00:00:00', end_date = '2024-10-30 23:59:59' WHERE name = 'PRACTICAL EXAM SCHEDULE DETAILS'"
        );
        console.log("Updated PRACTICAL EXAM SCHEDULE DETAILS to October");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

