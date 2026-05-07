require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function debug() {
    try {
        const examName = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
        const rolls = ['2024CSE001', '2024CSE002', '2024CSE003', '2024CSE004'];
        
        console.log("--- PROMOTION DEBUG ---");
        
        const students = await db.query("SELECT id, rollnumber, name, semister FROM students WHERE name ILIKE ANY($1)", [['%Alok Malewar%', '%Anusha Katukojwala%', '%Saniana KC%', '%Sriram Korla%']]);
        console.log(`Students found (${students.rows.length}):`, students.rows.map(r => r.name));
        
        for (const s of students.rows) {
            console.log(`\nChecking student: ${s.name} (${s.rollnumber})`);
            
            const marks = await db.query(`
                SELECT m.subject_id, sub.name, 
                       m.internal_marks, m.external_marks, m.grace_marks, e.moderation_marks,
                       (COALESCE(m.internal_marks, 0) + COALESCE(m.external_marks, 0) + COALESCE(e.moderation_marks, 0) + COALESCE(m.grace_marks, 0)) as calculated
                FROM marks m
                JOIN exams e ON m.exam_id = e.id
                JOIN master_subjects sub ON m.subject_id = sub.id
                WHERE m.student_id = $1 AND e.name = $2
            `, [s.id, examName]);
            
            console.log(`Marks records: ${marks.rows.length}`);
            let allPassed = true;
            marks.rows.forEach(m => {
                if (Number(m.calculated) < 40) {
                    console.log(`  - FAILED: ${m.name} (${m.calculated} < 40)`);
                    allPassed = false;
                } else {
                    console.log(`  - Passed: ${m.name} (${m.calculated})`);
                }
            });
            
            console.log(`Overall Pass: ${allPassed}`);
            
            const examSem = await db.query(`
                SELECT (regexp_matches(ms.semester_name, '\\d+'))[1] as digits
                FROM exams e
                JOIN master_semesters ms ON e.semester_id = ms.id
                WHERE e.name = $1
                LIMIT 1
            `, [examName]);
            const semDigit = examSem.rows[0]?.digits;
            console.log(`Exam Semester Digit: ${semDigit}`);
            console.log(`Student Semester: ${s.semister}`);
            const semMatch = s.semister.includes(semDigit);
            console.log(`Semester Match (~): ${semMatch}`);
        }
        
        console.log("\n--- DEBUG END ---");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debug();
