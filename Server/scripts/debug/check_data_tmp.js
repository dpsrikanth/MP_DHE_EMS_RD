const client = require('../../db');

async function checkData() {
    try {
        const studentCount = await client.query('SELECT COUNT(*) FROM students');
        console.log(`Total students: ${studentCount.rows[0].count}`);

        const studentsWithUserCount = await client.query('SELECT COUNT(*) FROM students WHERE user_id IS NOT NULL');
        console.log(`Students with user_id: ${studentsWithUserCount.rows[0].count}`);

        const userColleges = await client.query(`
            SELECT u.id, u.email, u.college_id, u.university_id, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.role_name = 'student'
            LIMIT 5
        `);
        console.log('\nSample Student Users:');
        console.table(userColleges.rows);

        const studentRecords = await client.query(`
            SELECT s.id, s.user_id, s."collageName", s.college_id
            FROM students s
            WHERE s.user_id IN (SELECT id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'student')
            LIMIT 5
        `);
        console.log('\nSample Student Records linked to Users:');
        console.table(studentRecords.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkData();
