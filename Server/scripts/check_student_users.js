const pool = require('../db');

async function check() {
    try {
        console.log('--- User Data Check ---');
        const res = await pool.query(`
            SELECT u.email, u.password, u.password_hash, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.role_name ILIKE 'student'
        `);
        console.log('Student Users Found:', res.rows.length);
        res.rows.forEach(row => {
            console.log(`Email: ${row.email}, Role: ${row.role_name}, Has Password: ${!!row.password}, Has Hash: ${!!row.password_hash}`);
            if (row.password) {
                console.log(`  Password starts with: ${row.password.substring(0, 7)}`);
            }
        });
        console.log('--- End Check ---');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
