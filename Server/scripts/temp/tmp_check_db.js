const db = require('../../Server/db');

async function check() {
    try {
        const res = await db.query('SELECT * FROM marks_workflow_status WHERE college_id IN (4, 10)');
        console.log('Records for colleges 4 and 10:');
        console.table(res.rows);
        
        const colleges = await db.query('SELECT id, name, college_id FROM colleges WHERE id IN (4, 10)');
        console.log('College Details:');
        console.table(colleges.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
