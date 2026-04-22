const client = require('../../db');

async function checkSchema() {
    try {
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'students'
        `);
        console.log('Students Table Columns:');
        result.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
        
        const userResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('\nUsers Table Columns:');
        userResult.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
