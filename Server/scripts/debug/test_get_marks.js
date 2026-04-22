const db = require('../../db');
async function test() {
    const query = `
            SELECT DISTINCT fs.subject_id, fs.college_id, fs.semester_id, fs.academic_year_id, fs.section,
                   COALESCE(ws.status, 'Pending') as status,
                   ws.id,
                   ws.updated_at,
                   s.name as subject_name, sem.semester_name as semester, 
                   mp.name as program_name, md.department_name
            FROM faculty_subjects fs
            LEFT JOIN marks_workflow_status ws 
                 ON ws.subject_id = fs.subject_id AND ws.section = fs.section 
                 AND ws.college_id = fs.college_id AND ws.semester_id = fs.semester_id 
                 AND ws.academic_year_id = fs.academic_year_id
            LEFT JOIN master_subjects s ON fs.subject_id = s.id
            LEFT JOIN master_semesters sem ON fs.semester_id = sem.id
            LEFT JOIN policy_program_subjects pps 
                 ON fs.subject_id = pps.subject_id AND fs.college_id = pps.college_id AND fs.semester_id = pps.semester_id
            LEFT JOIN master_programs mp ON pps.program_id = mp.id
            LEFT JOIN master_departments md ON pps.department_id = md.id
            WHERE fs.college_id = $1
    `;
    try {
        const res = await db.query(query, [10]);
        console.log("Returned rows:", res.rows.length);
        console.log(res.rows[0]);
    } catch(e) { console.error(e); }
    process.exit(0);
}
test();
