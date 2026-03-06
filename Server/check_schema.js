const client = require('./db');
const fs = require('fs');
async function check() {
    try {
        const u = await client.query("SELECT * FROM information_schema.columns WHERE table_name = 'users'");
        fs.writeFileSync('users_schema.json', JSON.stringify(u.rows, null, 2));
        const c = await client.query("SELECT * FROM information_schema.columns WHERE table_name = 'colleges'");
        fs.writeFileSync('colleges_schema.json', JSON.stringify(c.rows, null, 2));
    } catch (e) { }
    process.exit(0);
}
check();
