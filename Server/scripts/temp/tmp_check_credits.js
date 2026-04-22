const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function check() {
    try {
        const mappings = await pool.query(`SELECT id, name, mapping_type, credit FROM master_subjects LIMIT 10`);
        console.table(mappings.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
check();
