const pool = require('../db');

async function checkMilestones() {
    try {
        const res = await pool.query('SELECT * FROM academic_milestones ORDER BY start_date ASC');
        console.log("Academic Milestones:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkMilestones();
