const pool = require('../db');

async function run() {
    try {
        await pool.query("UPDATE academic_milestones SET end_date = '2024-09-25 23:59:59' WHERE id = 6"); // Internal Marks Entry (Mid-2)
        await pool.query("UPDATE academic_milestones SET end_date = '2024-09-30 23:59:59' WHERE id = 7"); // Internal Marks Approval (Mid-2)
        console.log("Restored IDs 6 and 7");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

