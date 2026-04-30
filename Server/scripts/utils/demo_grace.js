const db = require('./db');
const { applyGraceMarks } = require('./utils/graceUtils');

async function run() {
    const rollNumber = '25BT1303'; // Sanjana KC
    const examName = 'Programming Lab';
    
    console.log(`--- STARTING GRACE MARKS DEMO FOR ${rollNumber} ---`);

    try {
        // 1. Get student ID and University ID
        const studentRes = await db.query(`
            SELECT s.id, c.university_id 
            FROM students s
            LEFT JOIN colleges c ON s."collageName" = c.name
            WHERE s.rollnumber = $1
        `, [rollNumber]);
        
        if (studentRes.rows.length === 0) {
            console.log("Student not found");
            return;
        }
        const studentId = studentRes.rows[0].id;
        const universityId = studentRes.rows[0].university_id || 1;

        // 2. Set a temporary Grace Policy in the database
        console.log("1. Configuring Grace Policy (Enabled, Max 5 Total, Max 3 Per Subject)");
        await db.query(`
            UPDATE grading_configs 
            SET grace_policy = '{"is_enabled": true, "max_total_grace": 5, "max_per_subject_grace": 3}'
            WHERE university_id = $1
        `, [universityId]);

        // 3. Find her mark record for Programming Lab
        const markRes = await db.query(`
            SELECT m.* FROM marks m 
            JOIN exams e ON m.exam_id = e.id
            WHERE m.student_id = $1 AND e.name = $2
        `, [studentId, examName]);

        if (markRes.rows.length === 0) {
            console.log("No marks record found for this exam");
            return;
        }
        const markRecord = markRes.rows[0];

        // 4. Update her marks to be "FAILING" (e.g. 38 total)
        // Let's set internal=16, external=22 -> Total=38
        console.log(`2. Manually setting marks to 38 (Failing) - Current: ${markRecord.total_marks}`);
        await db.query(`
            UPDATE marks 
            SET internal_marks = 16, external_marks = 22, total_marks = 38, status = 'Fail', grace_marks = 0
            WHERE id = $1
        `, [markRecord.id]);

        // 5. Trigger Grace Marks Calculation
        console.log("3. Triggering Grace Engine (applyGraceMarks)...");
        await applyGraceMarks(studentId, examName, universityId, null);

        // 6. Verify result
        const finalRes = await db.query("SELECT * FROM marks WHERE id = $1", [markRecord.id]);
        const final = finalRes.rows[0];
        console.log("\n--- DEMO RESULT ---");
        console.log(`Subject: ${examName}`);
        console.log(`Original Total: 38 (FAIL)`);
        console.log(`New Total: ${final.total_marks}`);
        console.log(`Grace Marks Added: ${final.grace_marks}`);
        console.log(`New Status: ${final.status}`);
        console.log("\nNow you can refresh the Result Hub to see the +2 in the Grace column for Sanjana KC!");

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

run();
