const pool = require('../db.js');
async function run() {
    try {
        const res = await pool.query(`
            SELECT * FROM marks_workflow_status
            ORDER BY updated_at DESC LIMIT 20
        `);
        console.log('---START---');
        console.log('Count:', res.rowCount);
        res.rows.forEach(r => {
            console.log(`subject=${r.subject_id} | sem=${r.semester_id} | col=${r.college_id} | status=${r.status} | section=${r.section}`);
        });
        console.log('---END---');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

