const client = require('./db');
async function run() {
    try {
        console.log("--- ROLES ---");
        const roles = await client.query("SELECT * FROM roles");
        console.table(roles.rows);

        console.log("\n--- USERS WITH ROLES ---");
        const users = await client.query(`
            SELECT u.id, u.name, u.email, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id
        `);
        console.table(users.rows);

        console.log("\n--- EXTERNAL FACULTY CANDIDATES (Specific Role) ---");
        const external = await client.query(`
            SELECT u.id, u.name, u.email, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id
            WHERE r.role_name = 'External Faculty'
        `);
        console.table(external.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
