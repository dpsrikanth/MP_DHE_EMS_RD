const client = require('./db');
async function run() {
    try {
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log(res.rows.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
