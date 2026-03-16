const pool = require('../db');
const bcrypt = require('bcryptjs');

async function setupStudents() {
    try {
        console.log('Fetching students without user accounts...');
        const students = await pool.query('SELECT id, email, rollnumber, name FROM students WHERE user_id IS NULL AND email IS NOT NULL');
        
        console.log(`Found ${students.rows.length} students to setup.`);

        const studentRoleRes = await pool.query("SELECT id FROM roles WHERE role_name = 'Student'");
        if (studentRoleRes.rows.length === 0) {
            throw new Error('Student role not found. Please run migration first.');
        }
        const studentRoleId = studentRoleRes.rows[0].id;

        for (const student of students.rows) {
            const tempPassword = student.rollnumber || 'Student@123';
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            // Check if user with this email already exists
            const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [student.email]);
            let userId;

            if (userCheck.rows.length === 0) {
                console.log(`Creating user for ${student.name} (${student.email})...`);
                const userRes = await pool.query(
                    'INSERT INTO users (name, email, password_hash, password, role_id, is_active) VALUES ($1, $2, $3, NULL, $4, true) RETURNING id',
                    [student.name.trim(), student.email, passwordHash, studentRoleId]
                );
                userId = userRes.rows[0].id;
            } else {
                console.log(`User already exists for ${student.email}, linking to student record...`);
                userId = userCheck.rows[0].id;
            }

            await pool.query('UPDATE students SET user_id = $1 WHERE id = $2', [userId, student.id]);
        }

        console.log('Student account setup completed.');
    } catch (err) {
        console.error('Error setting up student accounts:', err);
    } finally {
        await pool.end();
    }
}

setupStudents();
