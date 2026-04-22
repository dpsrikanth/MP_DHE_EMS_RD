const db = require('../../db');

async function testQuery() {
  try {
    const query = `
            SELECT DISTINCT mws.*, s.name as subject_name, ay.year_name as academic_year, sem.semester_name as semester, mp.name as program_name
            FROM marks_workflow_status mws
            LEFT JOIN master_subjects s ON mws.subject_id = s.id
            LEFT JOIN master_academic_years ay ON mws.academic_year_id = ay.id
            LEFT JOIN master_semesters sem ON mws.semester_id = sem.id
            LEFT JOIN policy_program_subjects pps ON mws.subject_id = pps.subject_id AND mws.college_id = pps.college_id AND mws.semester_id = pps.semester_id
            LEFT JOIN master_programs mp ON pps.program_id = mp.id
            WHERE mws.college_id = 1
        `;
    const res = await db.query(query);
    console.log("SUCCESS:", res.rows.length);
  } catch (e) {
    console.error("DB ERROR:", e.message);
  } finally {
    process.exit();
  }
}
testQuery();
