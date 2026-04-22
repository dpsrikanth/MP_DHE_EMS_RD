const client = require('../../db');
async function run() {
    try {
        const res = await client.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'marks' AND schemaname = 'public';
        `);
        console.log("--- MARKS TABLE INDEXES ---");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
