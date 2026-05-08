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
        
        console.log('--- Remapping Assignment for Dr. Sonal Tiwari ---');
        // Find the assignment ID for Subject 21
        const findRes = await client.query(`SELECT id FROM faculty_subjects WHERE teacher_id = 31 AND subject_id = 21 AND status = 'Active'`);
        if (findRes.rows.length === 0) {
            console.log('Assignment not found');
            return;
        }
        const assignmentId = findRes.rows[0].id;
        console.log(`Found assignment ID: ${assignmentId}. Remapping to Subject 23...`);

        const updateRes = await client.query(`UPDATE faculty_subjects SET subject_id = 23 WHERE id = $1`, [assignmentId]);
        console.log(`Update result: ${updateRes.rowCount} row(s) updated.`);

        // Also check if we should delete the duplicate subject ID 21 to prevent future mistakes
        console.log('Remapping complete.');

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
