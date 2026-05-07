const db = require('../config/db');

async function debug() {
    try {
        const examName = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
        const studentRoll = '#25BT1304';
        
        console.log("--- DEBUG START ---");
        
        const student = await db.query("SELECT id, name, semister FROM students WHERE rollnumber = $1", [studentRoll]);
        console.log("Student Record:", student.rows[0]);
        
        const marks = await db.query(`
            SELECT m.subject_id, sub.name, m.total_marks, m.grace_marks, e.moderation_marks,
                   (COALESCE(m.total_marks, 0) + COALESCE(m.grace_marks, 0) + COALESCE(e.moderation_marks, 0)) as calculated_total
            FROM marks m
            JOIN exams e ON m.exam_id = e.id
            JOIN master_subjects sub ON m.subject_id = sub.id
            WHERE m.student_id = $1 AND e.name = $2
        `, [student.rows[0].id, examName]);
        
        console.log("Marks for student:");
        marks.rows.forEach(r => {
            console.log(`- ${r.name}: Total=${r.total_marks}, Grace=${r.grace_marks}, Mod=${r.moderation_marks} => Calculated=${r.calculated_total}`);
        });
        
        const allPassed = marks.rows.every(r => Number(r.calculated_total) >= 40);
        console.log("All Passed:", allPassed);
        
        const examSem = await db.query(`
            SELECT DISTINCT ms.semester_name 
            FROM exams e 
            JOIN master_semesters ms ON e.semester_id = ms.id 
            WHERE e.name = $1
        `, [examName]);
        console.log("Exam Semester Name:", examSem.rows[0]?.semester_name);
        
        console.log("--- DEBUG END ---");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debug();
