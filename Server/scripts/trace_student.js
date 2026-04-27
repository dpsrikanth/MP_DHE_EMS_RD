const db = require('../db');

async function trace() {
    try {
        console.log('--- Searching for Sriram Korla ---');
        const studentRes = await db.query("SELECT id, rollnumber, first_name FROM students WHERE rollnumber = '163B1A0549'");
        console.log(JSON.stringify(studentRes.rows, null, 2));

        if (studentRes.rows.length === 0) {
            console.log('Student not found!');
            return;
        }

        const sid = studentRes.rows[0].id;

        console.log('\n--- Internal Marks (Draft) ---');
        const sim = await db.query("SELECT * FROM student_internal_marks WHERE student_id = $1", [sid]);
        console.log(JSON.stringify(sim.rows, null, 2));

        console.log('\n--- Calculated Internal Marks ---');
        const cim = await db.query("SELECT * FROM calculated_internal_marks WHERE student_id = $1", [sid]);
        console.log(JSON.stringify(cim.rows, null, 2));

        console.log('\n--- Marks (Combined) ---');
        const m = await db.query("SELECT * FROM marks WHERE student_id = $1", [sid]);
        console.log(JSON.stringify(m.rows, null, 2));

        console.log('\n--- Exam Registrations ---');
        const er = await db.query("SELECT * FROM exam_registrations WHERE student_id = $1", [sid]);
        console.log(JSON.stringify(er.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

trace();

