const pool = require('./db');

async function testIsolation(userId, userName) {
    console.log(`\nTesting for ${userName} (ID: ${userId}):`);
    
    // 1. Assigned Exams Query (Modified)
    const assignedExamsQuery = `
      SELECT 
        ms.id as subject_id,
        ms.name as subject_name,
        COALESCE(sub_stats.sets_required, 0) as sets_required,
        COALESCE(sub_stats.sets_submitted, 0) as sets_submitted,
        sub_stats.latest_status
      FROM paper_setter_subjects pss
      JOIN master_subjects ms ON pss.subject_id = ms.id
      LEFT JOIN (
        SELECT 
          subject_id, exam_id,
          COUNT(id) as sets_required,
          COUNT(file_path) as sets_submitted,
          MAX(status) as latest_status
        FROM paper_assignments
        WHERE paper_setter_id = $1
        GROUP BY subject_id, exam_id
      ) sub_stats ON ms.id = sub_stats.subject_id
      WHERE pss.user_id = $1
    `;

    // 2. Submitted Papers Query (Modified)
    const submittedPapersQuery = `
      SELECT 
        pa.id as assignment_id,
        ms.name as subject_name,
        pa.status
      FROM paper_assignments pa
      JOIN master_subjects ms ON pa.subject_id = ms.id
      WHERE pa.paper_setter_id = $1
        AND (pa.file_path IS NOT NULL)
    `;

    try {
        const assignedRes = await pool.query(assignedExamsQuery, [userId]);
        console.log('Assigned Exams:');
        assignedRes.rows.forEach(row => {
            console.log(`- ${row.subject_name}: ${row.sets_submitted}/${row.sets_required} (${row.latest_status || 'N/A'})`);
        });

        const submittedRes = await pool.query(submittedPapersQuery, [userId]);
        console.log('Submitted Papers Count:', submittedRes.rows.length);
    } catch (err) {
        console.error('Error:', err);
    }
}

async function run() {
    await testIsolation(42, 'Dr Vasudev');
    await testIsolation(44, 'Dr Sridhar');
    await testIsolation(45, 'Dr Mahesh');
    pool.end();
}

run();
