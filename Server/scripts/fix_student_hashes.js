const pool = require('../db');

async function fix() {
    try {
        console.log('Fixing existing student user accounts...');
        
        // Find users with 'Student' role
        const studentRoleRes = await pool.query("SELECT id FROM roles WHERE role_name = 'Student'");
        if (studentRoleRes.rows.length === 0) {
            console.log('Student role not found.');
            return;
        }
        const studentRoleId = studentRoleRes.rows[0].id;

        // For users who have a hash in 'password' and NULL in 'password_hash'
        const result = await pool.query(
            `UPDATE users 
             SET password_hash = password, password = NULL 
             WHERE role_id = $1 AND password_hash IS NULL AND password LIKE '$2a$%'`,
            [studentRoleId]
        );

        console.log(`Updated ${result.rowCount} user accounts.`);
    } catch (err) {
        console.error('Fix failed:', err);
    } finally {
        await pool.end();
    }
}

fix();
