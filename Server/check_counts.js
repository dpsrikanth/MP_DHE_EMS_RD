require('dotenv').config({ path: './config/.env' });
const db = require('./config/db');

async function run() {
  // Simulate what the getAssignedStudents query returns for the external faculty
  // First let's see what assignments exist
  const r1 = await db.query(`
    SELECT efa.id, efa.faculty_user_id, efa.exam_id, efa.subject_id, efa.status,
           e.name as exam_name, u.email as faculty_email
    FROM external_faculty_assignments efa
    JOIN exams e ON e.id = efa.exam_id
    JOIN users u ON u.id = efa.faculty_user_id
    ORDER BY efa.id
  `);
  console.log('External Faculty Assignments:');
  console.table(r1.rows);

  // Now check what exams get joined via the name/year/semester match
  const r2 = await db.query(`
    SELECT 
      e_assigned.id as assigned_exam_id,
      e_assigned.name as assigned_exam_name,
      e_all.id as matched_exam_id,
      e_all.name as matched_exam_name,
      COUNT(er.id) as student_count
    FROM external_faculty_assignments efa
    JOIN exams e_assigned ON efa.exam_id = e_assigned.id
    JOIN exams e_all ON e_assigned.name = e_all.name 
                     AND e_assigned.academic_year_id = e_all.academic_year_id 
                     AND e_assigned.semester_id = e_all.semester_id
    JOIN exam_registrations er ON er.exam_id = e_all.id AND er.payment_status = 'Paid'
    GROUP BY e_assigned.id, e_assigned.name, e_all.id, e_all.name
    ORDER BY e_assigned.id, e_all.id
  `);
  console.log('\nExam join results with student counts:');
  console.table(r2.rows);

  process.exit();
}
run().catch(e => { console.error(e.message, e.stack); process.exit(1); });
