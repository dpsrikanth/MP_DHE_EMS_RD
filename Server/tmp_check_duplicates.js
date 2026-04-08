const db = require('./db');

async function check() {
    try {
        console.log("--- External Faculty Assignments ---");
        const assignments = await db.query("SELECT * FROM external_faculty_assignments");
        console.table(assignments.rows);

        const roll = '25BT1305';
        console.log(`--- Registrations for ${roll} ---`);
        const regs = await db.query(`
            SELECT er.id, er.student_id, er.exam_id, e.name as exam_name, e.subject_id 
            FROM exam_registrations er 
            JOIN exams e ON er.exam_id = e.id 
            JOIN students s ON er.student_id = s.id 
            WHERE s.rollnumber = $1
        `, [roll]);
        console.table(regs.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
