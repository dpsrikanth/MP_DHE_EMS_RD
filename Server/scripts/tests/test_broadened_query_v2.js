const client = require('../../db');

async function test() {
    try {
        const faculty_user_id = 27; // ext_verify@test.com
        console.log("Testing with Faculty ID:", faculty_user_id);

        const query = `
            SELECT 
                efa.id as assignment_id, efa.status as assignment_status,
                er.id as registration_id, er.student_id, 
                CONCAT(s.first_name, ' ', s.last_name) as student_name, s.rollnumber,
                e_all.id as exam_id, e_all.name as exam_name, 
                sub.id as subject_id, sub.name as subject_name,
                m.id as mark_id, m.external_marks, m.status as marks_status
            FROM external_faculty_assignments efa
            JOIN exams e_assigned ON efa.exam_id = e_assigned.id
            JOIN exams e_all ON e_assigned.name = e_all.name 
                             AND e_assigned.academic_year_id = e_all.academic_year_id 
                             AND e_assigned.semester_id = e_all.semester_id
            JOIN master_subjects sub ON e_all.subject_id = sub.id
            JOIN exam_registrations er ON er.exam_id = e_all.id AND er.payment_status = 'Paid'
            JOIN students s ON er.student_id = s.id
            LEFT JOIN marks m ON m.student_id = s.id AND m.exam_id = e_all.id
            WHERE efa.faculty_user_id = $1
              AND (efa.subject_id IS NULL OR efa.subject_id = sub.id)
            ORDER BY exam_name, student_name, subject_name
        `;

        const res = await client.query(query, [faculty_user_id]);
        console.log("Records found:", res.rows.length);
        console.table(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

test();
