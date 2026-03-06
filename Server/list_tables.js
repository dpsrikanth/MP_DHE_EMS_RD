const client = require('./db');
async function run() {
    try {
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%colleg%'");
        console.log(JSON.stringify(res.rows.map(r => r.table_name)));
    } catch (e) { }
    process.exit(0);
}
run();
