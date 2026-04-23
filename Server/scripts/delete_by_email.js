require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', host: '172.16.0.225', database: 'emsdb', password: '!ntense@225', port: 5432,
});

async function deleteByEmail() {
    const client = await pool.connect();
    try {
        const email = 'sriramkorla100@gmail.com';
        const res = await client.query('DELETE FROM students WHERE email = $1', [email]);
        console.log(`Deleted ${res.rowCount} records with email ${email}`);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

deleteByEmail();
