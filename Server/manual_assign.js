const client = require('./db');
async function run() {
    try {
        console.log("--- Manual Assignment Test ---");
        const registration_ids = [1, 2, 3, 4, 5];
        const faculty_user_id = 26;
        const assigned_by = 3; // Assuming user 3 is an admin

        for (const reg_id of registration_ids) {
            await client.query(`
                INSERT INTO external_faculty_assignments (faculty_user_id, registration_id, assigned_by, status)
                VALUES ($1, $2, $3, 'Assigned')
                ON CONFLICT (registration_id) DO UPDATE SET faculty_user_id = $1, assigned_by = $3, status = 'Assigned'
            `, [faculty_user_id, reg_id, assigned_by]);
        }
        console.log("Success: Assigned 5 students to faculty user 26.");

        // Verify assignment in DB
        const res = await client.query("SELECT * FROM external_faculty_assignments WHERE faculty_user_id = $1", [faculty_user_id]);
        console.log("Verification count:", res.rows.length);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
