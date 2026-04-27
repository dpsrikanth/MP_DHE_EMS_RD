const pool = require('../db.js');
async function run() {
    const res = await pool.query("SELECT id, name, subject_code, credit, semester_id, program_id FROM master_subjects WHERE program_id = 2 AND semester_id = 16");
    console.log(`Found ${res.rows.length} subjects for BTech Semester 2:`);
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
}
run();

