const client = require('../../db');

async function checkMapping() {
    try {
        const studentCollages = await client.query('SELECT DISTINCT "collageName" FROM students');
        console.log('Distinct Collage Names in Students:');
        console.table(studentCollages.rows);

        const allColleges = await client.query('SELECT id, name FROM colleges');
        console.log('\nColleges in Colleges Table:');
        console.table(allColleges.rows);

        const studentsWithUsers = await client.query(`
            SELECT s.id as student_id, s."collageName", u.email, u.college_id, u.university_id
            FROM students s
            JOIN users u ON s.user_id = u.id
            LIMIT 10
        `);
        console.log('\nStudents linked to Users:');
        console.table(studentsWithUsers.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkMapping();
