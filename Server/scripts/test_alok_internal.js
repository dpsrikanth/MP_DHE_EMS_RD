const pool = require('../db.js');
async function run() {
    try {
        const studentId = 4; // Alok
        
        const query = `
      WITH raw_internal AS (
          SELECT sim.student_id, sim.subject_id, 
                 SUM(sim.marks_obtained::float) as total_raw,
                 json_agg(json_build_object(
                    'name', ims.component_name,
                    'marks', sim.marks_obtained,
                    'max_marks', ims.max_marks
                 )) as components,
                 MAX(mws2.status) as batch_status
          FROM student_internal_marks sim
          JOIN internal_marks_structure ims ON sim.component_id = ims.id
          JOIN students s2 ON sim.student_id = s2.id
          JOIN colleges c2 ON s2."collageName" = c2.name
          JOIN master_semesters sem2 ON s2.semister = sem2.semester_name
          LEFT JOIN marks_workflow_status mws2 ON sim.subject_id = mws2.subject_id 
              AND mws2.college_id = c2.id 
              AND mws2.semester_id = sem2.id
          LEFT JOIN component_acceptance ca ON ca.component_id = sim.component_id
              AND ca.college_id = c2.id 
              AND ca.subject_id = sim.subject_id
          WHERE (mws2.status IN ('Approved', 'Locked') OR ca.is_accepted = true)
            AND sim.student_id = $1
          GROUP BY sim.student_id, sim.subject_id
      )
      SELECT 
        raw_internal.total_raw as internal_marks,
        sem.semester_name || ' Internal Assessments' as exam_name,
        sub.name as subject_name
      FROM students s
      JOIN master_programs p ON s."programName" = p.name
      JOIN raw_internal ON s.id = raw_internal.student_id
      JOIN master_subjects sub ON raw_internal.subject_id = sub.id
      LEFT JOIN (
          SELECT DISTINCT subject_id, semester_id 
          FROM faculty_subjects
      ) fs_sem ON fs_sem.subject_id = raw_internal.subject_id
      JOIN master_semesters sem ON fs_sem.semester_id = sem.id
      WHERE s.id = $1 AND raw_internal.total_raw IS NOT NULL
      
      ORDER BY subject_name ASC
        `;
        const res = await pool.query(query, [studentId]);
        console.log("Raw Internal:", JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

