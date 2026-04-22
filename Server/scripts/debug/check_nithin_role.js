const client = require('../../db');
async function run() {
    try {
        const query = `
            SELECT u.email, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.email = 'nithin@gmail.com'
        `;
        const res = await client.query(query);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
