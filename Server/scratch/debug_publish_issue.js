const db = require('../config/db');

async function debug() {
    const examName = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
    try {
        console.log(`--- Debugging Exam: ${examName} ---`);
        
        // 1. Get all subjects in this exam series
        const exams = await db.query(`
            SELECT id, name, subject_id, exam_type, is_published, results_published
            FROM exams 
            WHERE name = $1
        `, [examName]);
        
        console.log(`Found ${exams.rows.length} subjects in series.`);
        
        for (const e of exams.rows) {
            // 2. Check marks_submitted logic for this subject
            const efaRes = await db.query(`
                SELECT id, faculty_user_id, subject_id, status 
                FROM external_faculty_assignments 
                WHERE exam_id IN (SELECT id FROM exams WHERE name = $1)
                  AND (subject_id = $2 OR subject_id IS NULL)
            `, [examName, e.subject_id]);
            
            console.log(`Subject ID ${e.subject_id} (Exam ID ${e.id}):`);
            console.log(`  Assignments found: ${efaRes.rows.length}`);
            efaRes.rows.forEach(a => {
                console.log(`    - ID: ${a.id}, Status: ${a.status}, Global: ${a.subject_id === null}`);
            });
            
            const isSubmitted = efaRes.rows.some(a => ['Submitted', 'Approved', 'Finalized'].includes(a.status));
            console.log(`  Marks Submitted (Logic): ${isSubmitted}`);
            
            // 3. Check Internal Lock Status
            const mwsRes = await db.query(`
                SELECT status, college_id FROM marks_workflow_status WHERE subject_id = $1
            `, [e.subject_id]);
            console.log(`  Internal Workflow Status: ${mwsRes.rows.map(r => r.status + '(Col:' + r.college_id + ')').join(', ') || 'None'}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debug();
