const db = require('./db');
async function checkResults() {
    const studentId = 3;
    const query = `
      WITH ia_ranked AS (
          SELECT 
              sim_ia.student_id, 
              sim_ia.subject_id, 
              sim_ia.marks_obtained::float as marks,
              ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
          FROM student_internal_marks sim_ia
          JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
          WHERE ims_ia.component_name ILIKE 'IA%'
      ),
      ia_summary AS (
          SELECT ir.student_id, ir.subject_id, SUM(ir.marks) as ia_total
          FROM ia_ranked ir
          WHERE ir.rnk <= 2
          GROUP BY ir.student_id, ir.subject_id
      ),
      other_summary AS (
          SELECT 
              sim_o.student_id, 
              sim_o.subject_id, 
              SUM(sim_o.marks_obtained::float) as other_total
          FROM student_internal_marks sim_o
          JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
          WHERE ims_o.component_name NOT ILIKE 'IA%' 
            AND ims_o.component_name NOT ILIKE 'TOTAL%'
          GROUP BY sim_o.student_id, sim_o.subject_id
      ),
      raw_internal AS (
          SELECT 
              COALESCE(i.student_id, o.student_id) as student_id,
              COALESCE(i.subject_id, o.subject_id) as subject_id,
              (COALESCE(i.ia_total, 0) + COALESCE(o.other_total, 0)) as total_raw
          FROM ia_summary i
          FULL OUTER JOIN other_summary o ON i.student_id = o.student_id AND i.subject_id = o.subject_id
          GROUP BY COALESCE(i.student_id, o.student_id), COALESCE(i.subject_id, o.subject_id), i.ia_total, o.other_total
      )
      
      SELECT 
        e.name as exam_name,
        sub.subject_code,
        sub.name as subject_name,
        m.status,
        m.grace_marks,
        (COALESCE(raw_internal.total_raw, 0) + COALESCE(m.external_marks, 0) + COALESCE(m.grace_marks, 0)) as total_marks
      FROM students s
      JOIN master_programs p ON s."programName" = p.name
      LEFT JOIN colleges c ON LOWER(c.name) = LOWER(s."collageName")
      JOIN exams e ON e.program_id = p.id 
          AND (e.college_id = c.id OR (e.college_id IS NULL AND e.exam_type = 2))
      JOIN master_subjects sub ON e.subject_id = sub.id
      LEFT JOIN marks m ON m.exam_id = e.id AND m.student_id = s.id
      LEFT JOIN raw_internal ON s.id = raw_internal.student_id AND sub.id = raw_internal.subject_id
      WHERE s.id = $1 AND e.results_published = true AND e.exam_type = 2
        AND m.status IN ('Pass', 'Fail', 'Finalized', 'Approved', 'Pending Approval', 'Draft', 'Internal Only')
    `;
    try {
        const res = await db.query(query, [studentId]);
        console.log('Results:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkResults();
