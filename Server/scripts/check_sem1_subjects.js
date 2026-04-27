const pool = require('../db.js');
async function run() {
    const res = await pool.query("SELECT * FROM master_subjects WHERE program_id = 2 AND semester_id = 15");
    console.log(`Found ${res.rows.length} subjects for BTech Semester 1`);
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
}
run();

