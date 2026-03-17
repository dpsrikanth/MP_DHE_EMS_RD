const client = require('./Server/db');

async function verify() {
    try {
        const res = await client.query("SELECT * FROM roles WHERE role_name = 'External Faculty'");
        console.log('External Faculty Role:', res.rows);
        
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'external_faculty_assignments'
        `);
        console.log('Assignment Table:', tablesRes.rows);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
verify();
