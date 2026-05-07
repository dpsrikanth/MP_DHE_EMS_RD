const db = require('../config/db');
const { applyGraceMarks } = require('../utils/graceUtils');

async function fix() {
    try {
        const studentRes = await db.query("SELECT id FROM students WHERE rollnumber = '#25BT1304' OR name ILIKE '%Sriram Korla%'");
        if (studentRes.rows.length === 0) {
            console.log("Student not found");
            return;
        }
        const studentId = studentRes.rows[0].id;
        const examName = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
        
        console.log(`Fixing student ${studentId} for exam ${examName}`);
        
        // We need universityId. Let's find it from the exam.
        const examRes = await db.query("SELECT university_id FROM exams WHERE name = $1 LIMIT 1", [examName]);
        if (examRes.rows.length === 0) {
            console.log("Exam not found");
            return;
        }
        const universityId = examRes.rows[0].university_id;
        
        const applied = await applyGraceMarks(studentId, examName, universityId);
        console.log(`Applied ${applied} grace marks.`);
        
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

fix();
