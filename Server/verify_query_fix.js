const pool = require('./db');

async function testQuery() {
    try {
        console.log("--- Testing Updated getFinalizedExternalMarks Query ---");
        
        const query = `
            SELECT 
                m.id as mark_id, 
                er.student_id,
                er.exam_id,
                COALESCE(m.status, 'Internal Only') as marks_status,
                COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) as internal_marks, 
                COALESCE(m.external_marks, 0) as external_marks,
                (COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + COALESCE(m.external_marks, 0)) as total_marks,
                s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                e.name as exam_name,
                sub.name as subject_name, sub.id as subject_id,
                CASE 
                    WHEN (COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + COALESCE(m.external_marks, 0)) >= 40 THEN 'Pass'
                    ELSE 'Fail'
                END as result_status
            FROM exam_registrations er
            JOIN exams e ON er.exam_id = e.id
            JOIN master_subjects sub ON e.subject_id = sub.id
            JOIN students s ON er.student_id = s.id
            LEFT JOIN marks m ON m.student_id = er.student_id AND m.exam_id = er.exam_id AND m.subject_id = e.subject_id
            LEFT JOIN calculated_internal_marks cim ON er.student_id = cim.student_id 
                AND (cim.subject_id = e.subject_id OR cim.subject_id IN (SELECT id FROM master_subjects WHERE name = sub.name))
            LEFT JOIN (
                SELECT student_id, subject_id, SUM(marks_obtained::float) as total_raw
                FROM student_internal_marks
                GROUP BY student_id, subject_id
            ) raw_internal ON er.student_id = raw_internal.student_id AND e.subject_id = raw_internal.subject_id
            WHERE er.payment_status = 'Paid'
              AND (m.status IN ('Pending Approval', 'Approved', 'Draft', 'Internal Only') OR cim.id IS NOT NULL OR raw_internal.total_raw IS NOT NULL)
              AND s.rollnumber LIKE '%163B1A0549%'
            ORDER BY sub.name ASC, s.rollnumber ASC
        `;

        const result = await pool.query(query);
        console.log("Query Results:");
        result.rows.forEach(r => {
            console.log(`  Student: ${r.student_name} (${r.rollnumber})`);
            console.log(`  Subject: ${r.subject_name}`);
            console.log(`  Internal: ${r.internal_marks}`);
            console.log(`  External: ${r.external_marks}`);
            console.log(`  Total: ${r.total_marks}`);
            console.log(`  Result: ${r.result_status}`);
            console.log("  -----------------------------");
        });

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        process.exit();
    }
}

testQuery();
