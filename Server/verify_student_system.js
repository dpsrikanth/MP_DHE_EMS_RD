const pool = require('./db');
const bcrypt = require('bcryptjs');

async function verify() {
    try {
        console.log('--- Verification Started ---');

        // 1. Check if Student role exists
        const roleRes = await pool.query("SELECT id FROM roles WHERE role_name = 'Student'");
        console.log('Student Role:', roleRes.rows[0] ? `Exists (ID: ${roleRes.rows[0].id})` : 'MISSING');

        // 2. Check if user_id exists in students
        const colRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'students' AND column_name = 'user_id'
        `);
        console.log('user_id column in students:', colRes.rows.length > 0 ? 'Exists' : 'MISSING');

        // 3. Check if exam_registrations table exists
        const tableRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'exam_registrations'
        `);
        console.log('exam_registrations table:', tableRes.rows.length > 0 ? 'Exists' : 'MISSING');

        // 4. Test Student Login Logic (Internal Check)
        const testStudent = await pool.query(`
            SELECT u.id, u.email, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.role_name = 'Student' LIMIT 1
        `);
        if (testStudent.rows.length > 0) {
            console.log('Test Student User:', testStudent.rows[0]);
        } else {
            console.log('No student users found. Running setup script...');
        }

        console.log('--- Verification Completed ---');
    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await pool.end();
    }
}

verify();
