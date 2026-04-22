const client = require('../../db');
async function run() {
    try {
        const res = await client.query("SELECT * FROM roles");
        console.log("Roles:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
