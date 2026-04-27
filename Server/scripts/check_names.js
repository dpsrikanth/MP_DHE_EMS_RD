const pool = require('../db');
async function run() {
    try {
        const res = await pool.query("SELECT id, name, start_date, end_date FROM academic_milestones");
        console.log("All Milestones:");
        res.rows.forEach(r => console.log(`[${r.id}] ${r.name} | ${r.start_date} -> ${r.end_date}`));
    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();

