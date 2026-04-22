const db = require('../../db');

async function clearTestData() {
    try {
        const subId = 10;
        const section = 'A';
        const yearId = 1;
        const semId = 15;
        const collegeId = 10;

        console.log(`Clearing marks for Subject ID ${subId}, Section ${section}...`);

        // 1. Delete internal marks
        const marksRes = await db.query("DELETE FROM student_internal_marks WHERE subject_id = $1", [subId]);
        console.log(`Deleted ${marksRes.rowCount} internal marks records.`);

        // 2. Delete/Reset workflow status
        const workRes = await db.query(
            "DELETE FROM marks_workflow_status WHERE subject_id = $1 AND section = $2 AND college_id = $3 AND semester_id = $4 AND academic_year_id = $5",
            [subId, section, collegeId, semId, yearId]
        );
        console.log(`Deleted ${workRes.rowCount} workflow status records.`);

        // 3. Delete student marks review
        const reviewRes = await db.query(
            "DELETE FROM student_marks_review WHERE subject_id = $1 AND section = $2 AND college_id = $3 AND semester_id = $4 AND academic_year_id = $5",
            [subId, section, collegeId, semId, yearId]
        );
        console.log(`Deleted ${reviewRes.rowCount} student review records.`);

        console.log('Test data cleared successfully!');

    } catch (err) {
        console.error('Error clearing data:', err);
    } finally {
        process.exit();
    }
}

clearTestData();
