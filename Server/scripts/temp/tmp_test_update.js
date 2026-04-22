const db = require('../../Server/db');

async function testUpdate() {
    try {
        const teacherId = 19; // From my previous check
        const payload = {
            name: 'josephs updated',
            email: 'josephs@example.com', // Assuming this is their email
            college_id: 10,
            designation_id: 1, // Assuming HOD is 1
            department_id: 1, // Assuming CSE is 1
            qualification: 'M.Tech',
            experience: 10,
            specialization: 'Computer Science',
            pan_no: 'ABCDE1234F',
            aadhaar_no: '121323243454',
            dob: '1990-01-01',
            gender: 'Male',
            joining_date: '2015-01-01',
            phone: '9440237469',
            address: 'Updated Address',
            status: 'Active'
        };

        // We can't easily call the controller function directly without a req/res object
        // but we can simulate the update logic or just see if the DB update works.
        
        console.log('Testing DB update for teacher 19...');
        
        await db.query('BEGIN');
        
        const teacherResult = await db.query("SELECT user_id FROM master_teachers WHERE id = $1", [teacherId]);
        const userId = teacherResult.rows[0].user_id;

        await db.query("UPDATE users SET name = $1 WHERE id = $2", [payload.name, userId]);
        
        const updateQuery = `
            UPDATE master_teachers 
            SET qualification = $1, experience_years = $2, address = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `;
        const res = await db.query(updateQuery, [payload.qualification, payload.experience, payload.address, teacherId]);
        
        console.log('Update result:', res.rows[0]);
        
        await db.query('COMMIT');
        console.log('Update successful!');

    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        process.exit(0);
    }
}

testUpdate();
