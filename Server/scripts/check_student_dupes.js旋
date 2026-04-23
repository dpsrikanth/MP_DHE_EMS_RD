require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function checkDuplicates() {
    const client = await pool.connect();
    try {
        const admissionDupes = await client.query("SELECT admission_no, COUNT(*) FROM students GROUP BY admission_no HAVING COUNT(*) > 1");
        console.log("Duplicate Admission Numbers:", admissionDupes.rows);

        const rollDupes = await client.query("SELECT rollnumber, COUNT(*) FROM students GROUP BY rollnumber HAVING COUNT(*) > 1");
        console.log("Duplicate Roll Numbers:", rollDupes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

checkDuplicates();
