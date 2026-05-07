const db = require('../config/db');

async function debug() {
    const examName = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
    try {
        console.log(`--- Debugging Exam: ${examName} ---`);
        
        // 1. Get all subjects in this exam series and their registration counts
        const exams = await db.query(`
            SELECT e.id, e.name, e.subject_id, sub.name as subject_name,
                   (SELECT COUNT(*) FROM exam_registrations er WHERE er.exam_id = e.id AND er.payment_status = 'Paid') as reg_count
            FROM exams e
            JOIN master_subjects sub ON e.subject_id = sub.id
            WHERE e.name = $1
        `, [examName]);
        
        console.log(`Found ${exams.rows.length} subjects in series.`);
        
        let totalNeeded = 0;
        let totalSubmitted = 0;

        for (const e of exams.rows) {
            // 2. Check marks_submitted logic for this subject
            const efaRes = await db.query(`
                SELECT id, status, subject_id 
                FROM external_faculty_assignments 
                WHERE (exam_id IN (SELECT id FROM exams WHERE name = $1))
                  AND (subject_id = $2 OR subject_id IS NULL)
            `, [examName, e.subject_id]);
            
            const isSubmitted = efaRes.rows.some(a => ['Submitted', 'Approved', 'Finalized'].includes(a.status));
            
            console.log(`Subject: ${e.subject_name} (ID: ${e.subject_id})`);
            console.log(`  Registrations: ${e.reg_count}`);
            console.log(`  Assignment Statuses: ${efaRes.rows.map(a => a.status + (a.subject_id === null ? '(Global)' : '')).join(', ') || 'None'}`);
            console.log(`  Submitted: ${isSubmitted}`);
            
            if (parseInt(e.reg_count) > 0) {
                totalNeeded++;
                if (isSubmitted) totalSubmitted++;
            }
        }
        
        console.log(`--- Summary ---`);
        console.log(`Subjects with registrations: ${totalNeeded}`);
        console.log(`Submitted subjects with registrations: ${totalSubmitted}`);
        console.log(`All subjects (including empty): ${exams.rows.length}`);
        
        const allSubmitted = exams.rows.every(e => {
            // This replicates the current logic which might be failing due to empty subjects
            return true; // placeholder
        });

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debug();
