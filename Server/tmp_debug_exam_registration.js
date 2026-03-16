const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function run() {
    try {
        console.log('--- Roles ---');
        const roles = await pool.query('SELECT * FROM roles');
        console.table(roles.rows);

        console.log('--- Master Roles ---');
        const masterRoles = await pool.query('SELECT * FROM master_roles');
        console.table(masterRoles.rows);

        console.log('--- External Exams ---');
        const extExams = await pool.query('SELECT * FROM external_exams LIMIT 5');
        console.table(extExams.rows);

        console.log('--- Exams columns ---');
        const examsCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exams'
        `);
        console.table(examsCols.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
