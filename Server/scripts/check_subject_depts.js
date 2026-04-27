const pool = require('../db.js');
async function run() {
    const res = await pool.query(`
        SELECT s.id, s.name, 
               (SELECT json_agg(department_id) FROM master_subject_departments WHERE subject_id = s.id) as dept_ids
        FROM master_subjects s 
        WHERE s.program_id = 2 AND s.semester_id = 16
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
}
run();

