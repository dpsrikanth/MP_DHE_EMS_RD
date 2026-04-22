const client = require('../../db');

async function run() {
    try {
        console.log("--- Checking Exam Registrations ---");
        const regs = await client.query(`
            SELECT id, payment_status, created_at 
            FROM exam_registrations 
            ORDER BY created_at DESC 
            LIMIT 20
        `);
        console.table(regs.rows);

        console.log("\n--- Checking External Faculty Assignments ---");
        const asgn = await client.query(`
            SELECT * FROM external_faculty_assignments
        `);
        console.table(asgn.rows);

        console.log("\n--- Checking Pending Registrations (Calculated) ---");
        const pending = await client.query(`
            SELECT 
                er.id as registration_id,
                er.payment_status,
                efa.id as assignment_id
            FROM exam_registrations er
            LEFT JOIN external_faculty_assignments efa ON er.id = efa.registration_id
            WHERE er.payment_status = 'Paid'
            AND efa.id IS NULL
        `);
        console.log("Found", pending.rows.length, "paid registrations without assignment.");
        console.table(pending.rows.slice(0, 10));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
