const client = require('../../db');
async function run() {
    try {
        const faculty = await client.query(`
            SELECT u.id, u.name, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.role_name = 'External Faculty'
        `);
        console.log('--- External Faculty Users ---');
        console.table(faculty.rows);

        const asgn = await client.query(`
            SELECT * FROM external_faculty_assignments
        `);
        console.log('\n--- Current Assignments ---');
        console.table(asgn.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
