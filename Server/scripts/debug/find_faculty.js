const client = require('../../db');
async function run() {
    try {
        // List all roles first
        const rolesRes = await client.query("SELECT * FROM roles");
        console.log("Available Roles:");
        console.table(rolesRes.rows);

        // Find users who are teachers/faculty
        const query = `
            SELECT u.id, u.email, u.name, r.role_name, u.password
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.role_name ILIKE '%Teacher%' OR r.role_name ILIKE '%Faculty%' OR r.role_name ILIKE '%Lect%' or r.role_name ILIKE '%Prof%';
        `;
        const res = await client.query(query);
        console.log("\nFaculty/Teacher Users:");
        console.table(res.rows);

        // Check master_teachers to see linked users
        const query2 = `
            SELECT mt.id as teacher_id, u.email, u.name, r.role_name
            FROM master_teachers mt
            JOIN users u ON mt.user_id = u.id
            JOIN roles r ON u.role_id = r.id;
        `;
        const res2 = await client.query(query2);
        console.log("\nUsers in master_teachers table:");
        console.table(res2.rows);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
