const pool = require('../db.js');
const fs = require('fs');
async function run() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };
    try {
        const sem2Res = await pool.query('SELECT name, "rollnumber", "collageName", "programName", "batch", "semister" FROM students WHERE "semister" = \'Semester 2\'');
        log('Students already in Semester 2:');
        sem2Res.rows.forEach(r => log(`${r.name} | ${r.rollnumber} | ${r.batch} | ${r.programName}`));

        const sem1Res = await pool.query('SELECT name, "rollnumber", "collageName", "programName", "batch", "semister" FROM students WHERE "semister" = \'Semester 1\' LIMIT 10');
        log('\nSample Semester 1 Students:');
        sem1Res.rows.forEach(r => log(`${r.name} | ${r.rollnumber} | ${r.batch} | ${r.programName}`));

    } catch (err) {
        log('\nERROR: ' + err.message);
    } finally {
        fs.writeFileSync('/tmp/student_diag_2.txt', output);
        pool.end();
    }
}
run();

