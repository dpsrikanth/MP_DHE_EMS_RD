const db = require('../../db');

async function debug() {
    try {
        console.log("--- EXAM SERIES INFO ---");
        const examName = 'BTech Sem-1 Mp college Internal Exam 2024-2025';
        const examRes = await db.query(
            "SELECT id, name, semester_id, program_id, college_id, subject_id, exam_type FROM exams WHERE name = $1", 
            [examName]
        );
        console.log("Exams matching name:", examRes.rows);

        if (examRes.rows.length > 0) {
            const e = examRes.rows[0];
            console.log("--- REGISTRATIONS COUNT ---");
            const regRes = await db.query(
                "SELECT count(*) FROM exam_registrations WHERE exam_id = $1",
                [e.id]
            );
            console.log("Registrations for this exact ID:", regRes.rows[0].count);

            console.log("--- MWS STATUS ---");
            const mwsRes = await db.query(
                "SELECT * FROM marks_workflow_status WHERE college_id = $1 AND subject_id = $2",
                [e.college_id, e.subject_id]
            );
            console.log("MWS results:", mwsRes.rows);

            console.log("--- STUDENT COUNT (Scope) ---");
            const studentRes = await db.query(
                `SELECT count(*) FROM students s 
                 JOIN colleges c ON s."collageName" ILIKE c.name 
                 WHERE c.id = $1 AND s.semister = (SELECT semester_name FROM master_semesters WHERE id = $2)`,
                [e.college_id, e.semester_id]
            );
            console.log("Students in this college/semester:", studentRes.rows[0].count);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

debug();
