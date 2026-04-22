const client = require('../../db');

async function run() {
    try {
        const res = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'audit_logs'
            ORDER BY ordinal_position;
        `);
        console.log("Schema dump:");
        res.rows.forEach(r => {
            console.log(`${r.table_name}.${r.column_name} : ${r.data_type}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
}
run();
