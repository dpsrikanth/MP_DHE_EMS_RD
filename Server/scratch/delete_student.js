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
        const studentId = 11;

        // Check dependencies
        const deps = await client.query(`
            SELECT
                tc.table_name, 
                kcu.column_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='students' AND ccu.column_name='id';
        `);
        
        console.log('Dependencies found:', deps.rows.length);
        
        for (const dep of deps.rows) {
            console.log(`Deleting from ${dep.table_name}...`);
            await client.query(`DELETE FROM ${dep.table_name} WHERE ${dep.column_name} = $1`, [studentId]);
        }

        console.log('Deleting from students...');
        await client.query('DELETE FROM students WHERE id = $1', [studentId]);
        
        console.log('Success: Student and all related records deleted.');
    } catch (err) {
        console.error('Operation failed:', err.message);
    } finally {
        await client.end();
    }
}

run();
