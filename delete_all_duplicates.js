const pool = require('./Server/db');

async function deleteDuplicateExams() {
    const client = await pool.connect();
    try {
        const nameMatch = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
        console.log(`Searching for all exams with name: "${nameMatch}"`);
        
        const { rows: duplicateExams } = await client.query("SELECT id FROM exams WHERE name = $1", [nameMatch]);
        
        if (duplicateExams.length === 0) {
            console.log("No exams found with that name.");
            return;
        }

        const ids = duplicateExams.map(r => r.id);
        console.log(`Found IDs to delete: ${ids.join(', ')}`);

        await client.query('BEGIN');

        for (const id of ids) {
            console.log(`Deleting dependencies for Exam ID: ${id}`);
            await client.query('DELETE FROM marks WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM exam_registrations WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM external_faculty_assignments WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM external_exam_marks WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM student_external_marks WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM student_external_marks_components WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM paper_assignments WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM seating_arrangements WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM exam_seating_locks WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM seat_allocations WHERE exam_id = $1', [id]);
            await client.query('DELETE FROM secrecy_codes WHERE exam_id = $1', [id]);
            
            console.log(`Deleting Exam ID: ${id}`);
            await client.query('DELETE FROM exams WHERE id = $1', [id]);
        }

        await client.query('COMMIT');
        console.log("All matching exams deleted successfully.");

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Deletion failed:", error);
    } finally {
        client.release();
        pool.end();
    }
}

deleteDuplicateExams();
