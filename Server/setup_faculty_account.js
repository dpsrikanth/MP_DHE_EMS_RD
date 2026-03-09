const client = require('./db');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        await client.query("BEGIN");

        // 1. Ensure 'faculty' role exists in the roles table
        await client.query("INSERT INTO roles (role_name) VALUES ('faculty') ON CONFLICT (role_name) DO NOTHING");
        const roleRes = await client.query("SELECT id FROM roles WHERE role_name = 'faculty'");
        const facultyRoleId = roleRes.rows[0].id;

        // 2. Hash the password
        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Update nithin@gmail.com user
        await client.query(
            `UPDATE users 
             SET password = null, 
                 password_hash = $1, 
                 role_id = $2 
             WHERE email = 'nithin@gmail.com'`,
            [passwordHash, facultyRoleId]
        );

        await client.query("COMMIT");
        console.log("Successfully configured nithin@gmail.com as a faculty user.");
        console.log("Login: nithin@gmail.com");
        console.log("Password: password123");

    } catch (e) {
        await client.query("ROLLBACK");
        console.error("Error configuring faculty account:", e);
    }
    process.exit(0);
}
run();
