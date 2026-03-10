const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function checkTables() {
    try {
        console.log('--- Checking for subjects table ---');
        const subjectsExist = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subjects')");
        console.log('Exists:', subjectsExist.rows[0].exists);
        if (subjectsExist.rows[0].exists) {
            const subjectsCount = await pool.query("SELECT count(*) FROM subjects");
            console.log('Count:', subjectsCount.rows[0].count);
        }

        console.log('\n--- Checking for master_subjects table ---');
        const masterSubjectsExist = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'master_subjects')");
        console.log('Exists:', masterSubjectsExist.rows[0].exists);
        if (masterSubjectsExist.rows[0].exists) {
            const masterCount = await pool.query("SELECT count(*) FROM master_subjects");
            console.log('Count:', masterCount.rows[0].count);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkTables();
