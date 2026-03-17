const client = require('./db');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        const password = 'Password123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Find 'External Faculty' role
        const roleRes = await client.query("SELECT id FROM roles WHERE role_name = 'External Faculty'");
        if (roleRes.rows.length === 0) {
            console.error("External Faculty role not found.");
            return;
        }
        const roleId = roleRes.rows[0].id;

        // Create user
        const userRes = await client.query(`
            INSERT INTO users (name, email, password, role_id, is_active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (email) DO UPDATE SET password = $3, role_id = $4, is_active = true
            RETURNING id
        `, ['External Verify', 'ext_verify@test.com', hashedPassword, roleId]);

        const userId = userRes.rows[0].id;
        console.log(`User created/updated: ext_verify@test.com (ID: ${userId})`);

        // Assign some students if possible
        const regRes = await client.query(`
            SELECT er.id FROM exam_registrations er
            LEFT JOIN external_faculty_assignments efa ON er.id = efa.registration_id
            WHERE er.payment_status = 'Paid' AND efa.id IS NULL
            LIMIT 3
        `);

        for (const reg of regRes.rows) {
            await client.query(`
                INSERT INTO external_faculty_assignments (faculty_user_id, registration_id, assigned_by, status)
                VALUES ($1, $2, $1, 'Assigned')
                ON CONFLICT (registration_id) DO UPDATE SET faculty_user_id = $1, status = 'Assigned'
            `, [userId, reg.id]);
            console.log(`Assigned registration ${reg.id} to user ${userId}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
