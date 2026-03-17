const client = require('./Server/db');
const bcrypt = require('bcryptjs');

async function verify() {
    try {
        console.log("--- 1. Checking Roles ---");
        const rolesRes = await client.query("SELECT * FROM roles");
        console.table(rolesRes.rows);

        const extRole = rolesRes.rows.find(r => r.role_name === 'External Faculty');
        if (!extRole) {
            console.error("CRITICAL: 'External Faculty' role not found!");
        } else {
            console.log("'External Faculty' role is present with ID:", extRole.id);
        }

        console.log("\n--- 2. Checking Tables ---");
        const tables = ['external_faculty_assignments', 'marks', 'exam_registrations', 'users'];
        for (const table of tables) {
            const res = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            `, [table]);
            console.log(`Table '${table}':`, res.rows.length > 0 ? 'EXISTS' : 'MISSING');
        }

        console.log("\n--- 3. Checking for External Faculty User ---");
        const userRes = await client.query(`
            SELECT u.id, u.name, u.email, r.role_name 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.role_name = 'External Faculty'
        `);
        console.log("External Faculty Users found:", userRes.rows.length);
        if (userRes.rows.length === 0) {
            console.log("Creating a test External Faculty user...");
            const hashedPassword = await bcrypt.hash('password123', 10);
            const newUser = await client.query(`
                INSERT INTO users (name, email, password, role_id, is_active)
                VALUES ('Test External Faculty', 'external@test.com', $1, $2, TRUE)
                RETURNING id, name, email
            `, [hashedPassword, extRole.id]);
            console.log("Test External Faculty created:", newUser.rows[0]);
        } else {
            console.table(userRes.rows);
        }

        console.log("\n--- 4. Checking for student registrations to assign ---");
        const regRes = await client.query(`
            SELECT er.id, s.name as student_name, e.name as exam_name
            FROM exam_registrations er
            JOIN students s ON er.student_id = s.id
            JOIN exams e ON er.exam_id = e.id
            WHERE er.payment_status = 'Paid'
            LIMIT 5
        `);
        console.log("Paid registrations found:", regRes.rows.length);
        console.table(regRes.rows);

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        process.exit(0);
    }
}

verify();
