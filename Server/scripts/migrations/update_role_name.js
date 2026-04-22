const client = require('../../db');
async function run() {
    try {
        await client.query("UPDATE roles SET role_name = 'Faculty' WHERE role_name = 'faculty'");
        console.log("Updated role name to Faculty");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
