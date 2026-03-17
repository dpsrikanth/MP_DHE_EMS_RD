const client = require('./db');

async function run() {
    try {
        console.log("--- Adding Unique Constraint ---");
        // Add unique constraint on registration_id if not exists
        await client.query(`
            ALTER TABLE external_faculty_assignments 
            ADD CONSTRAINT unique_registration_assignment UNIQUE (registration_id)
        `).catch(e => {
            if (e.code === '42710') {
                console.log("Constraint already exists.");
            } else {
                throw e;
            }
        });

        console.log("--- Re-running Manual Assignment ---");
        const registration_ids = [1, 2, 3, 4, 5];
        const faculty_user_id = 26;
        const assigned_by = 3;

        for (const reg_id of registration_ids) {
            await client.query(`
                INSERT INTO external_faculty_assignments (faculty_user_id, registration_id, assigned_by, status)
                VALUES ($1, $2, $3, 'Assigned')
                ON CONFLICT (registration_id) DO UPDATE SET faculty_user_id = $1, assigned_by = $3, status = 'Assigned'
            `, [faculty_user_id, reg_id, assigned_by]);
        }
        console.log("Success: Assigned 5 students to faculty user 26.");

        const res = await client.query("SELECT * FROM external_faculty_assignments WHERE faculty_user_id = $1", [faculty_user_id]);
        console.log("Verification count:", res.rows.length);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
