const client = require('./db');
async function run() {
    try {
        const query = `
            SELECT u.id, u.email, u.name, r.role_name, u.password, u.password_hash, mt.id as teacher_id
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN master_teachers mt ON mt.user_id = u.id
            WHERE u.password IS NOT NULL OR u.password_hash IS NOT NULL;
        `;
        const res = await client.query(query);
        console.log("Users with Passwords:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
