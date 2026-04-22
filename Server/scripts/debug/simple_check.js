const client = require('../../db');
async function run() {
    try {
        const roles = await client.query("SELECT * FROM roles WHERE role_name = 'External Faculty'");
        console.log('Role found:', roles.rows.length > 0);
        
        const users = await client.query("SELECT count(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'External Faculty'");
        console.log('Ext Faculty Count:', users.rows[0].count);
        
        const regs = await client.query("SELECT count(*) FROM exam_registrations WHERE payment_status = 'Paid'");
        console.log('Paid Registrations:', regs.rows[0].count);
        
        const table = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'external_faculty_assignments'");
        console.log('Table Exists:', table.rows[0].count === '1');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
