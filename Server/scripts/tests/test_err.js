const db = require('../../db.js');
async function test() {
    try {
        await db.query('SELECT rollnumber FROM student_records LIMIT 1');
        console.log('student_records OK');
    } catch(e) { console.log('student_records FAIL', e.message); }

    try {
        await db.query('SELECT rollnumber FROM attendance LIMIT 1');
        console.log('attendance OK');
    } catch(e) { console.log('attendance FAIL', e.message); }

    try {
        await db.query('SELECT rollnumber FROM grading_external_marks LIMIT 1');
        console.log('grading_external_marks OK');
    } catch(e) { console.log('grading_external_marks FAIL', e.message); }
    process.exit(0);
}
test();
