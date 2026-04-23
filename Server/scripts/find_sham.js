require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', host: '172.16.0.225', database: 'emsdb', password: '!ntense@225', port: 5432,
});

async function findSham() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT id, name, email, admission_no FROM students WHERE name ILIKE '%sham%' AND \"deleteStatus\" = true");
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

findSham();
