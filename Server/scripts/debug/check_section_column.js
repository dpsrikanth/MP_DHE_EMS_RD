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
        const tables = ['student_marks_review', 'student_internal_marks', 'marks_workflow_status'];
        for (let t of tables) {
            console.log(`--- ${t} ---`);
            const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = $1
            `, [t]);
            console.log(res.rows.map(r => r.column_name).join(', '));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
