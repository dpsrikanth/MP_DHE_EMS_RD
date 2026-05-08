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
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'internal_exam_schedules'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err.message);
    } finally {
        await client.end();
    }
}

run();
