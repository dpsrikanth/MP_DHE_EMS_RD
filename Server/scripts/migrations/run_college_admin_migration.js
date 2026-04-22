const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    user: 'postgres',
    host: '172.16.0.225',
    database: 'emsdb',
    password: '!ntense@225',
});

async function runMigration() {
    await client.connect();
    try {
        await client.query('BEGIN');

        // Read and execute the college admin schema script
        const collegeAdminSqlPath = path.join(__dirname, 'migrations', 'college_admin_workflow.sql');
        console.log(`Executing college_admin schema from: ${collegeAdminSqlPath}`);
        const collegeAdminSql = fs.readFileSync(collegeAdminSqlPath, 'utf8');
        await client.query(collegeAdminSql);
        console.log('College Admin Schema updated successfully.');

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.end();
    }
}

runMigration();
