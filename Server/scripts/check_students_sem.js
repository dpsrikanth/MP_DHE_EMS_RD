const pool = require('../db.js');
const fs = require('fs');
async function run() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };
    try {
        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'");
        const columnNames = cols.rows.map(r => r.column_name);
        log('Columns in students table: ' + columnNames.join(', '));

        const hasSemister = columnNames.includes('semister');
        const hasBatch = columnNames.includes('batchName');
        
        if (hasSemister) {
            const res = await pool.query('SELECT "semister", COUNT(*) FROM students GROUP BY "semister"');
            log('\nStudent counts by semester string:');
            res.rows.forEach(r => log(`${r.semister}: ${r.count}`));
        }

        if (hasBatch && hasSemister) {
            const batchRes = await pool.query('SELECT "batchName", "semister", COUNT(*) FROM students GROUP BY "batchName", "semister" ORDER BY "batchName"');
            log('\nStudent counts by Batch and Semester:');
            batchRes.rows.forEach(r => log(`${r.batchName} | ${r.semister}: ${r.count}`));
        }

        const subjects = await pool.query('SELECT name, "rollnumber", "collageName", "programName", "batchName", "semister" FROM students LIMIT 20');
        log('\nSample Students:');
        subjects.rows.forEach(r => log(`${r.name} | ${r.rollnumber} | ${r.batchName} | ${r.semister}`));

    } catch (err) {
        log('\nERROR: ' + err.message);
    } finally {
        fs.writeFileSync('/tmp/student_diag.txt', output);
        pool.end();
    }
}
run();

