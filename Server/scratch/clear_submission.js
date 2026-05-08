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
        
        // Find the subject and component
        const findQuery = `
            SELECT ca.*, ms.name as subject_name, ims.component_name 
            FROM component_acceptance ca 
            JOIN master_subjects ms ON ca.subject_id = ms.id 
            JOIN internal_marks_structure ims ON ca.component_id = ims.id 
            WHERE ms.name ILIKE '%Basic Electrical Engineering%' 
              AND ims.component_name = 'IA2'
        `;
        
        const res = await client.query(findQuery);
        console.log('Found records:', res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));

        if (res.rows.length > 0) {
            const ids = res.rows.map(r => r.component_id); // Wait, component_id is part of the PK
            
            for (const row of res.rows) {
                console.log(`Deleting submission for Subject ID: ${row.subject_id}, Component ID: ${row.component_id}, Section: ${row.section}`);
                await client.query(`
                    DELETE FROM component_acceptance 
                    WHERE subject_id = $1 AND component_id = $2 AND section = $3 AND college_id = $4
                `, [row.subject_id, row.component_id, row.section, row.college_id]);
            }
            console.log('Successfully cleared submission status.');
        } else {
            console.log('No matching submission record found in component_acceptance. Checking marks_workflow_status...');
            
            const findWorkflowQuery = `
                SELECT mws.*, ms.name as subject_name 
                FROM marks_workflow_status mws
                JOIN master_subjects ms ON mws.subject_id = ms.id
                WHERE ms.name ILIKE '%Basic Electrical Engineering%'
            `;
            const wfRes = await client.query(findWorkflowQuery);
            console.log('Workflow records:', wfRes.rows.length);
            console.log(JSON.stringify(wfRes.rows, null, 2));
            
            for (const row of wfRes.rows) {
                console.log(`Deleting workflow status for Subject ID: ${row.subject_id}, Section: ${row.section}`);
                await client.query(`DELETE FROM marks_workflow_status WHERE id = $1`, [row.id]);
            }
        }

    } catch (err) {
        console.error('Operation failed:', err.message);
    } finally {
        await client.end();
    }
}

run();
