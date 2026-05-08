const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    host: '172.16.0.225',
    database: 'emsdb',
    password: '!ntense@225',
    port: 5432,
});

async function run() {
    try {
        await client.connect();
        
        console.log('--- Checking schedules for Subject ID 23 (BTH205) ---');
        const query = `SELECT * FROM internal_exam_schedules WHERE subject_id = 23`;
        const res = await client.query(query);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
