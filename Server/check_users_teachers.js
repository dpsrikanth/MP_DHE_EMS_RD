const client = require('./db');
async function run() {
    try {
        const query = `
            SELECT u.id, u.email, u.name, r.role_name, u.password, mt.id as teacher_id
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN master_teachers mt ON mt.user_id = u.id;
        `;
        const res = await client.query(query);
        console.log("Users and Teacher Linkage:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
