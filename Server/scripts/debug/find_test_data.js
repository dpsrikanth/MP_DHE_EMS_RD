const db = require('../../db');

async function findSubjectData() {
    try {
        const yearRes = await db.query("SELECT id FROM master_academic_years WHERE year_name = '2024-2025'");
        const semRes = await db.query("SELECT id FROM master_semesters WHERE semester_name = 'Semester 1'");
        const subRes = await db.query("SELECT id FROM master_subjects WHERE subject_code = 'CS101'");
        
        console.log('Year IDs:', yearRes.rows);
        console.log('Semester IDs:', semRes.rows);
        console.log('Subject IDs:', subRes.rows);

        const yearId = yearRes.rows[0]?.id;
        const semId = semRes.rows[0]?.id;
        const subId = subRes.rows[0]?.id;

        if (subId) {
            // Find students with marks for this subject
            const marksCount = await db.query("SELECT COUNT(*) FROM student_internal_marks WHERE subject_id = $1", [subId]);
            console.log('Internal Marks Count:', marksCount.rows[0].count);
            
            const workflow = await db.query("SELECT * FROM marks_workflow_status WHERE subject_id = $1 AND section = 'A'", [subId]);
            console.log('Workflow Status:', workflow.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findSubjectData();
