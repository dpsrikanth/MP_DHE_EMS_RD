const pool = require('../db.js');
async function run() {
    // Mimic the query in controller.js getSubjects
    let query = "SELECT s.id, s.name, s.subject_code, s.credit as credits, s.status, s.program_id, s.semester_id FROM master_subjects s WHERE s.program_id = 2 AND s.semester_id = 16";
    const res = await pool.query(query);
    console.log(`API check: Found ${res.rows.length} subjects for scheduling`);
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
}
run();

