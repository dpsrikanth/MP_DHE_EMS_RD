const pool = require('../../db');

async function verifyMultiSubmission() {
    console.log('Testing Multiple Submissions per Subject/Set:');
    
    const subject_id = 11; // Engineering Mathematics-I
    const exam_id = 45;     // Valid exam_id for subject 11
    const set_name = 'A';
    const vasudev_id = 42;
    const sridhar_id = 44;
    const hod_id = 42; // arbitrary

    try {
        console.log('1. Assigning Set A to Vasudev...');
        await pool.query(`
            INSERT INTO paper_assignments (subject_id, exam_id, set_name, paper_setter_id, assigned_by_id, status)
            VALUES ($1, $2, $3, $4, $5, 'Pending')
            ON CONFLICT (subject_id, exam_id, set_name, paper_setter_id) DO UPDATE SET status = 'Pending'
        `, [subject_id, exam_id, set_name, vasudev_id, hod_id]);

        console.log('2. Assigning Set A to Sridhar...');
        await pool.query(`
            INSERT INTO paper_assignments (subject_id, exam_id, set_name, paper_setter_id, assigned_by_id, status)
            VALUES ($1, $2, $3, $4, $5, 'Pending')
            ON CONFLICT (subject_id, exam_id, set_name, paper_setter_id) DO UPDATE SET status = 'Pending'
        `, [subject_id, exam_id, set_name, sridhar_id, hod_id]);

        console.log('3. Verifying both assignments exist...');
        const checkRes = await pool.query(`
            SELECT id, paper_setter_id, status 
            FROM paper_assignments 
            WHERE subject_id = $1 AND exam_id = $2 AND set_name = $3
        `, [subject_id, exam_id, set_name]);
        
        console.log('Assignments found:', checkRes.rows.length);
        checkRes.rows.forEach(r => console.log(`- Setter: ${r.paper_setter_id}, Status: ${r.status}`));

        if (checkRes.rows.length >= 2) {
            console.log('SUCCESS: Multiple assignments allowed for the same set.');
        } else {
            console.log('FAILURE: Multiple assignments were NOT allowed.');
        }

        console.log('\n4. Verifying Secrecy Dashboard view...');
        const dashboardQuery = `
            SELECT pa.id as assignment_id, pa.set_name, u.name as setter_name
            FROM paper_assignments pa
            LEFT JOIN users u ON pa.paper_setter_id = u.id
            WHERE pa.subject_id = $1 AND pa.exam_id = $2
        `;
        const dashRes = await pool.query(dashboardQuery, [subject_id, exam_id]);
        console.log('Dashboard rows for subject:', dashRes.rows.length);
        dashRes.rows.forEach(r => console.log(`- Set ${r.set_name} by ${r.setter_name}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

verifyMultiSubmission();
