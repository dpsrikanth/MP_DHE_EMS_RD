const pool = require('../db.js');
async function run() {
    const sem2SubjectsRes = await pool.query(`SELECT id, name FROM master_subjects WHERE program_id = 2 AND semester_id = 16`);
    const deptId = 68; // Computer Science and Engineering
    
    console.log(`Mapping subjects for BTech Sem 2 to department ${deptId}...`);
    
    for (const sub of sem2SubjectsRes.rows) {
        // Check if already mapped
        const check = await pool.query(`SELECT 1 FROM master_subject_departments WHERE subject_id = $1 AND department_id = $2`, [sub.id, deptId]);
        if (check.rows.length === 0) {
            await pool.query(`INSERT INTO master_subject_departments (subject_id, department_id) VALUES ($1, $2)`, [sub.id, deptId]);
            console.log(`Mapped ${sub.name} (ID: ${sub.id}) to department ${deptId}`);
        } else {
            console.log(`${sub.name} (ID: ${sub.id}) already mapped.`);
        }
    }
    pool.end();
}
run();

