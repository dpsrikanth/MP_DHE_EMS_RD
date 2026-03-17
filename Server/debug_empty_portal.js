const client = require('./db');

async function debug() {
    try {
        const faculty_email = 'ext_verify@test.com';
        const fRes = await client.query("SELECT id FROM users WHERE email = $1", [faculty_email]);
        if (fRes.rows.length === 0) {
            console.log("Faculty not found");
            return;
        }
        const faculty_user_id = fRes.rows[0].id;
        console.log("Faculty ID:", faculty_user_id);

        const assignments = await client.query("SELECT * FROM external_faculty_assignments WHERE faculty_user_id = $1", [faculty_user_id]);
        console.log("Assignments:", assignments.rows);

        if (assignments.rows.length === 0) {
            console.log("No assignments found in DB for this faculty.");
            return;
        }

        const query = `
            SELECT efa.id as assignment_id, efa.status as assignment_status,
                   er.id as registration_id, er.student_id, 
                   CONCAT(s.first_name, ' ', s.last_name) as student_name, s.rollnumber,
                   e.id as exam_id, e.name as exam_name, 
                   sub.id as subject_id, sub.name as subject_name,
                   m.id as mark_id, m.external_marks, m.status as marks_status
            FROM external_faculty_assignments efa
            JOIN exams e ON efa.exam_id = e.id
            JOIN exam_registrations er ON er.exam_id = e.id AND er.payment_status = 'Paid'
            JOIN students s ON er.student_id = s.id
            JOIN marks m ON m.student_id = s.id AND m.exam_id = e.id
            JOIN master_subjects sub ON m.subject_id = sub.id
            WHERE efa.faculty_user_id = $1
              AND (efa.subject_id IS NULL OR efa.subject_id = m.subject_id)
        `;
        
        console.log("Running main query...");
        const result = await client.query(query, [faculty_user_id]);
        console.log("Result Count:", result.rows.length);
        console.table(result.rows);

        if (result.rows.length === 0) {
            console.log("\n--- Checking why result is zero ---");
            const checkER = await client.query(`
                SELECT er.student_id, e.name as exam_name
                FROM external_faculty_assignments efa
                JOIN exams e ON efa.exam_id = e.id
                JOIN exam_registrations er ON er.exam_id = e.id AND er.payment_status = 'Paid'
                WHERE efa.faculty_user_id = $1
            `, [faculty_user_id]);
            console.log("Students with Paid registrations for assigned exams:", checkER.rows.length);

            const checkMarks = await client.query(`
                SELECT m.student_id, m.subject_id, m.exam_id
                FROM marks m
                WHERE m.exam_id IN (SELECT exam_id FROM external_faculty_assignments WHERE faculty_user_id = $1)
            `, [faculty_user_id]);
            console.log("Total marks records for assigned exams:", checkMarks.rows.length);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

debug();
