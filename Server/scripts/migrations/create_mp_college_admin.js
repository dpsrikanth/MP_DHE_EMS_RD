const db = require('../../db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const password = 'mpadmin@2024';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const name = 'MP College Admin';
        const email = 'mp_college_admin@mpu.ac.in';
        const role_id = 4; // college_admin
        const college_id = 9; // MP UNIVERSITY college
        const university_id = 7; // MP UNIVERSITY university

        // Insert user
        const res = await db.query(`
            INSERT INTO users (name, email, password, password_hash, role_id, college_id, university_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            ON CONFLICT (email) DO UPDATE SET 
                password = $3, 
                password_hash = $4,
                role_id = $5, 
                college_id = $6, 
                university_id = $7,
                is_active = true
            RETURNING id
        `, [name, email, hashedPassword, hashedPassword, role_id, college_id, university_id]);

        console.log(`Successfully created/updated college admin for MP UNIVERSITY:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`User ID: ${res.rows[0].id}`);

    } catch (err) {
        console.error('Error creating admin:', err);
    } finally {
        process.exit(0);
    }
}

createAdmin();
