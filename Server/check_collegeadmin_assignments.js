const client = require('./db');
async function run() {
    try {
        const query = `
            SELECT fs.*, mt.user_id, u.email
            FROM faculty_subjects fs
            JOIN master_teachers mt ON fs.teacher_id = mt.id
            JOIN users u ON mt.user_id = u.id
            WHERE u.email = 'collegeadmin@test.com';
        `;
        const res = await client.query(query);
        console.log("Assignments for collegeadmin@test.com:");
        console.table(res.rows);

        const query2 = `
            SELECT fs.*, mt.user_id, u.email
            FROM faculty_subjects fs
            JOIN master_teachers mt ON fs.teacher_id = mt.id
            JOIN users u ON mt.user_id = u.id;
        `;
        const res2 = await client.query(query2);
        console.log("\nAll Faculty Assignments:");
        console.table(res2.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
