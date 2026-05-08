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
        
        const subjectId = 20;
        const componentId = 87;

        console.log(`Deleting marks for Subject ID: ${subjectId}, Component ID: ${componentId}...`);
        const res = await client.query(`
            DELETE FROM student_internal_marks 
            WHERE subject_id = $1 AND component_id = $2
        `, [subjectId, componentId]);
        
        console.log(`Successfully deleted ${res.rowCount} mark records.`);

    } catch (err) {
        console.error('Operation failed:', err.message);
    } finally {
        await client.end();
    }
}

run();
