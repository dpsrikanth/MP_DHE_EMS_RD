const db = require('./db');

async function debug() {
    try {
        const sim = await db.query("SELECT COUNT(*) FROM student_internal_marks");
        console.log('SIM COUNT:', sim.rows[0].count);

        const mws = await db.query("SELECT COUNT(*) FROM marks_workflow_status");
        console.log('MWS COUNT:', mws.rows[0].count);

        const cim = await db.query("SELECT COUNT(*) FROM calculated_internal_marks");
        console.log('CIM COUNT:', cim.rows[0].count);

        const m = await db.query("SELECT COUNT(*) FROM marks");
        console.log('MARKS COUNT:', m.rows[0].count);
        
        const mwsAll = await db.query("SELECT * FROM marks_workflow_status");
        console.log('MWS ALL:', JSON.stringify(mwsAll.rows));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

debug();
