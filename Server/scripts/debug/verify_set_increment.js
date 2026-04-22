const pool = require('../../db');

async function verifySetIncrement() {
    console.log('Testing Automatic Set Name Incrementing:');
    
    const subject_id = 11; // Engineering Mathematics-I
    const exam_id = 45;
    const setter_1 = 42; // Vasudev
    const setter_2 = 44; // Sridhar
    const setter_3 = 45; // Mahesh

    try {
        // 1. Cleanup existing assignments for this subject/exam to start fresh for test
        console.log('Cleaning up existing assignments for test...');
        await pool.query('DELETE FROM paper_assignments WHERE subject_id = $1 AND exam_id = $2', [subject_id, exam_id]);

        // 2. Simulate ad-hoc upload from Setter 1
        console.log('Simulating ad-hoc upload from Setter 1...');
        const res1 = await pool.query(
            `INSERT INTO paper_assignments (subject_id, exam_id, paper_setter_id, assigned_by_id, set_name, status) 
             VALUES ($1, $2, $3, $4, (SELECT CHR(ASCII(COALESCE(MAX(set_name), '@')) + 1) FROM paper_assignments WHERE subject_id = $1 AND exam_id = $2), 'Pending') 
             RETURNING set_name`,
            [subject_id, exam_id, setter_1, setter_1]
        );
        console.log('Setter 1 assigned Set:', res1.rows[0].set_name);

        // 3. Simulate ad-hoc upload from Setter 2
        console.log('Simulating ad-hoc upload from Setter 2...');
        const res2 = await pool.query(
            `INSERT INTO paper_assignments (subject_id, exam_id, paper_setter_id, assigned_by_id, set_name, status) 
             VALUES ($1, $2, $3, $4, (SELECT CHR(ASCII(COALESCE(MAX(set_name), '@')) + 1) FROM paper_assignments WHERE subject_id = $1 AND exam_id = $2), 'Pending') 
             RETURNING set_name`,
            [subject_id, exam_id, setter_2, setter_2]
        );
        console.log('Setter 2 assigned Set:', res2.rows[0].set_name);

        // 4. Simulate ad-hoc upload from Setter 3
        console.log('Simulating ad-hoc upload from Setter 3...');
        const res3 = await pool.query(
            `INSERT INTO paper_assignments (subject_id, exam_id, paper_setter_id, assigned_by_id, set_name, status) 
             VALUES ($1, $2, $3, $4, (SELECT CHR(ASCII(COALESCE(MAX(set_name), '@')) + 1) FROM paper_assignments WHERE subject_id = $1 AND exam_id = $2), 'Pending') 
             RETURNING set_name`,
            [subject_id, exam_id, setter_3, setter_3]
        );
        console.log('Setter 3 assigned Set:', res3.rows[0].set_name);

        if (res1.rows[0].set_name === 'A' && res2.rows[0].set_name === 'B' && res3.rows[0].set_name === 'C') {
            console.log('\nSUCCESS: Set names incremented correctly (A, B, C).');
        } else {
            console.log('\nFAILURE: Set names did not increment as expected.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

verifySetIncrement();
