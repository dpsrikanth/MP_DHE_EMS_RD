const db = require('../db');

async function trace() {
    try {
        console.log('--- Searching for Sriram Korla (163B1A0549) ---');
        const sRes = await db.query("SELECT id, rollnumber, first_name FROM students WHERE rollnumber = '163B1A0549'");
        if (sRes.rows.length === 0) {
            console.log('Student not found');
            return;
        }
        const sid = sRes.rows[0].id;
        console.log('Student ID:', sid);

        console.log('\n--- Subject Search ---');
        const subRes = await db.query("SELECT id, name FROM master_subjects WHERE name ILIKE '%Programming for Problem Solving%'");
        console.log('Subjects found:', subRes.rows);
        const subIds = subRes.rows.map(r => r.id);

        if (subIds.length > 0) {
            console.log('\n--- Internal Marks (student_internal_marks) ---');
            const sim = await db.query("SELECT * FROM student_internal_marks WHERE student_id = $1 AND subject_id = ANY($2)", [sid, subIds]);
            console.log(JSON.stringify(sim.rows, null, 2));

            console.log('\n--- Calculated Internal Marks (calculated_internal_marks) ---');
            const cim = await db.query("SELECT * FROM calculated_internal_marks WHERE student_id = $1 AND subject_id = ANY($2)", [sid, subIds]);
            console.log(JSON.stringify(cim.rows, null, 2));

            console.log('\n--- Workflow Status (marks_workflow_status) ---');
            const mws = await db.query("SELECT * FROM marks_workflow_status WHERE subject_id = ANY($1)", [subIds]);
            console.log(JSON.stringify(mws.rows, null, 2));
            
            console.log('\n--- Marks Table (External/Combined) ---');
            const m = await db.query("SELECT * FROM marks WHERE student_id = $1 AND subject_id = ANY($2)", [sid, subIds]);
            console.log(JSON.stringify(m.rows, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

trace();

