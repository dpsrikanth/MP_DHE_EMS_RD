const pool = require('./db');

async function simulate() {
    try {
        const student_id = 1;
        const subject_id = 11;
        const exam_id = 45;
        const faculty_user_id = 26; // Adjusted to match my previous find
        const academic_year_id = 1;

        console.log("--- BEFORE SAVE ---");
        const before = await pool.query("SELECT * FROM marks WHERE student_id = $1 AND subject_id = $2 AND exam_id = $3", [student_id, subject_id, exam_id]);
        console.log(before.rows);

        console.log("--- SAVING MARKS ---");
        // Simulate save-marks
        await pool.query("UPDATE marks SET external_marks = 55.00, status = 'Draft' WHERE student_id = $1 AND subject_id = $2 AND exam_id = $3", [student_id, subject_id, exam_id]);
        
        console.log("--- FINALIZING ---");
        // Simulate finalize-marks
        await pool.query("UPDATE marks SET status = 'Pending Approval' WHERE student_id = $1 AND subject_id = $2 AND exam_id = $3", [student_id, subject_id, exam_id]);
        await pool.query("UPDATE external_faculty_assignments SET status = 'Submitted' WHERE faculty_user_id = $1 AND (exam_id = $2 OR exam_id IS NULL) AND (subject_id = $3 OR subject_id IS NULL)", [faculty_user_id, exam_id, subject_id]);

        console.log("--- AFTER FINALIZE ---");
        const after = await pool.query("SELECT * FROM marks WHERE student_id = $1 AND subject_id = $2 AND exam_id = $3", [student_id, subject_id, exam_id]);
        console.log(after.rows);
        
        const assignment = await pool.query("SELECT * FROM external_faculty_assignments WHERE id = 1");
        console.log("Assignment Status:", assignment.rows[0].status);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
simulate();
