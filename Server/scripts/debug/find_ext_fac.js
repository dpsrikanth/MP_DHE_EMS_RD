const client = require('../../db');
async function run() {
    try {
        const res = await client.query(`
            SELECT u.email, u.password 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.role_name = 'External Faculty' 
            LIMIT 1
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
