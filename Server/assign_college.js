const client = require('./db');
async function run() {
    try {
        const collegeRes = await client.query("SELECT id FROM colleges WHERE name ILIKE '%MP College%'");
        if (collegeRes.rows.length === 0) {
            console.log('MP College not found');
        } else {
            const collegeId = collegeRes.rows[0].id;
            await client.query('UPDATE users SET college_id = $1 WHERE email = $2', [collegeId, 'collegeadmin@test.com']);
            console.log('Assigned college_id ' + collegeId + ' to collegeadmin@test.com');
        }
    } catch (e) { console.error(e); }
    process.exit(0);
}
run();
