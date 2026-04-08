const db = require('./Server/db');
async function check() {
    try {
        const res = await db.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        console.log('TABLES:', res.rows.map(r => r.tablename));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
