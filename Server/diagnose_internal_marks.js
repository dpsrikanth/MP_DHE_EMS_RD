const pool = require('./db');

async function diagnose() {
    try {
        console.log("--- ID Consistency Check ---");
        
        const studentIds = [1, 2, 3, 4];
        const subjectId = 11;

        // 1. Marks table for these students and subject
        const marksRes = await pool.query("SELECT id, student_id, subject_id, exam_id, internal_marks, external_marks FROM marks WHERE student_id = ANY($1) AND subject_id = $2", [studentIds, subjectId]);
        console.log("Marks table entries:");
        marksRes.rows.forEach(r => console.log(`  Mark ID ${r.id}, Student ${r.student_id}, Subject ${r.subject_id}, Exam ${r.exam_id}, Internal: ${r.internal_marks}, External: ${r.external_marks}`));

        // 2. Exam registrations for these students and subject (via exam)
        const regRes = await pool.query(`
            SELECT er.student_id, er.exam_id, e.subject_id as exam_subject_id
            FROM exam_registrations er
            JOIN exams e ON er.exam_id = e.id
            WHERE er.student_id = ANY($1) AND e.subject_id = $2
        `, [studentIds, subjectId]);
        console.log("Exam registrations:");
        regRes.rows.forEach(r => console.log(`  Student ${r.student_id}, Exam ${r.exam_id}, Exam Subject ${r.exam_subject_id}`));

        // 3. Raw internal marks sum for these students and subject
        const rawInternalRes = await pool.query(`
            SELECT student_id, subject_id, SUM(marks_obtained::float) as total_raw
            FROM student_internal_marks
            WHERE student_id = ANY($1) AND subject_id = $2
            GROUP BY student_id, subject_id
        `, [studentIds, subjectId]);
        console.log("Raw internal marks sum:");
        rawInternalRes.rows.forEach(r => console.log(`  Student ${r.student_id}, Subject ${r.subject_id}, Total Raw: ${r.total_raw}`));

    } catch (err) {
        console.error("Diagnosis failed:", err);
    } finally {
        process.exit();
    }
}

diagnose();
