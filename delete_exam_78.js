const pool = require('./Server/db');

async function deleteExam78() {
    const client = await pool.connect();
    try {
        const examId = 78;
        console.log(`Starting deletion process for Exam ID: ${examId}`);

        await client.query('BEGIN');

        // Delete dependencies
        console.log("- Deleting marks...");
        await client.query('DELETE FROM marks WHERE exam_id = $1', [examId]);

        console.log("- Deleting registrations...");
        await client.query('DELETE FROM exam_registrations WHERE exam_id = $1', [examId]);

        console.log("- Deleting faculty assignments...");
        await client.query('DELETE FROM external_faculty_assignments WHERE exam_id = $1', [examId]);

        // Delete any other possible links found in meta-analysis
        await client.query('DELETE FROM external_exam_marks WHERE exam_id = $1', [examId]);
        await client.query('DELETE FROM student_external_marks WHERE exam_id = $1', [examId]);
        await client.query('DELETE FROM student_external_marks_components WHERE exam_id = $1', [examId]);
        await client.query('DELETE FROM paper_assignments WHERE exam_id = $1', [examId]);
        await client.query('DELETE FROM seating_arrangements WHERE exam_id = $1', [examId]);
        await client.query('DELETE FROM exam_seating_locks WHERE exam_id = $1', [examId]);
        await client.query('DELETE FROM seat_allocations WHERE exam_id = $1', [examId]);
        await client.query('DELETE FROM secrecy_codes WHERE exam_id = $1', [examId]);

        // Finally delete the exam
        console.log("- Deleting exam record...");
        const res = await client.query('DELETE FROM exams WHERE id = $1 RETURNING name', [examId]);

        if (res.rowCount > 0) {
            console.log(`Successfully deleted exam: ${res.rows[0].name}`);
            await client.query('COMMIT');
        } else {
            console.log(`Exam ID ${examId} not found.`);
            await client.query('ROLLBACK');
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Deletion failed:", error);
    } finally {
        client.release();
        pool.end();
    }
}

deleteExam78();
