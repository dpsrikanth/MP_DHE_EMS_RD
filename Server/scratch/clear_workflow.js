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
        
        const findQuery = `
            SELECT mws.*, ms.name as subject_name 
            FROM marks_workflow_status mws
            JOIN master_subjects ms ON mws.subject_id = ms.id
            WHERE ms.name ILIKE '%Basic Electrical Engineering%'
        `;
        
        const res = await client.query(findQuery);
        console.log('Found workflow records:', res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));

        if (res.rows.length > 0) {
            for (const row of res.rows) {
                console.log(`Deleting subject-level submission for Subject ID: ${row.subject_id}, Section: ${row.section}`);
                await client.query(`DELETE FROM marks_workflow_status WHERE id = $1`, [row.id]);
            }
            console.log('Successfully cleared subject-level submission status.');
        }

    } catch (err) {
        console.error('Operation failed:', err.message);
    } finally {
        await client.end();
    }
}

run();
