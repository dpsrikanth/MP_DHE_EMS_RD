const pool = require('../db.js');
const fs = require('fs');
async function run() {
    const res = await pool.query('SELECT id, name, start_date, end_date FROM academic_milestones WHERE semester_id = 16 ORDER BY start_date');
    fs.writeFileSync('sem2_milestones.json', JSON.stringify(res.rows, null, 2), 'utf8');
    console.log('File written.');
    pool.end();
}
run();

