const client = require('./Server/db');
async function checkRoles() {
    try {
        const res = await client.query('SELECT * FROM roles');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkRoles();
