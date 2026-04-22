const client = require('../../db');
async function run() {
    try {
        const query = `
            SELECT u.id, u.email, u.name, r.role_name, u.password
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id;
        `;
        const res = await client.query(query);
        console.log("All Users:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
