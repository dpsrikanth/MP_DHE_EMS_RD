require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function findStudent() {
    const client = await pool.connect();
    try {
        const email = 'sriramkorla100@gmail.com';
        const res = await client.query('SELECT id, name, email, admission_no, "deleteStatus", "collageName" FROM students WHERE email = $1', [email]);
        console.log("Search Results for " + email + ":");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

findStudent();
