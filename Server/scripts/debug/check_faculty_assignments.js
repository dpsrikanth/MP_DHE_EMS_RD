const client = require('../../db');
async function run() {
    try {
        const query = `
            SELECT fs.id, mt.name as teacher_name, u.email, u.name as user_name, r.role_name
            FROM faculty_subjects fs
            JOIN master_teachers mt ON fs.teacher_id = mt.id
            LEFT JOIN users u ON mt.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id;
        `;
        const res = await client.query(query);
        console.log("Faculty Assignments:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
