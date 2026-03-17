const client = require('./db');

async function list() {
    try {
        const res = await client.query(`
            SELECT schemaname, tablename 
            FROM pg_catalog.pg_tables 
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

list();
