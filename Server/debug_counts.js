const db = require('./db');

async function countData() {
    try {
        const res = await db.query("SELECT COUNT(*) FROM internal_marks_structure");
        console.log("Total internal_marks_structure records:", res.rows[0].count);
        
        const collegeRes = await db.query("SELECT DISTINCT college_id FROM internal_marks_structure");
        console.log("College IDs with marks structures:", collegeRes.rows.map(r => r.college_id));

        const roundsCount = await db.query("SELECT COUNT(*) FROM internal_exam_rounds");
        console.log("Total internal_exam_rounds records:", roundsCount.rows[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

countData();
