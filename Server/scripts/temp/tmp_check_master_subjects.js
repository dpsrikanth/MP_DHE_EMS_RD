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
        const schema = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'master_subjects'`);
        console.log('Columns:', schema.rows);

        const mappings = await pool.query(`SELECT DISTINCT mapping_type FROM master_subjects`);
        console.log('Distinct mapping_types:', mappings.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
check();
