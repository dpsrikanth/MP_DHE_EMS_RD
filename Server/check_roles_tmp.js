const client = require('./db');

async function checkRoles() {
    try {
        const roles = await client.query('SELECT * FROM roles');
        console.log('Roles:');
        console.table(roles.rows);

        const users = await client.query(`
            SELECT u.id, u.email, r.role_name, u.college_id, u.university_id
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id DESC
            LIMIT 10
        `);
        console.log('\nRecent Users:');
        console.table(users.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkRoles();
