const client = require('./db');
const bcrypt = require('bcryptjs');

async function checkUser() {
    try {
        const roleRes = await client.query('SELECT id FROM roles WHERE role_name = $1', ['college_admin']);
        if (roleRes.rows.length === 0) {
            console.log('Role college_admin not found!');
            process.exit(1);
        }
        const roleId = roleRes.rows[0].id;

        let userRes = await client.query('SELECT * FROM users WHERE email = $1', ['collegeadmin@test.com']);
        if (userRes.rows.length > 0) {
            console.log('User collegeadmin@test.com exists.');
            const hashedPassword = await bcrypt.hash('password', 10);
            await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, 'collegeadmin@test.com']);
            console.log('Password reset to password');
        } else {
            console.log('Creating user collegeadmin@test.com...');
            const hashedPassword = await bcrypt.hash('password', 10);
            await client.query(
                'INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4)',
                ['College Admin Test', 'collegeadmin@test.com', hashedPassword, roleId]
            );
            console.log('Created collegeadmin@test.com / password');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkUser();
