const client = require('../../db');

async function run() {
    try {
        const res = await client.query(`SELECT * FROM student_internal_marks LIMIT 20`);
        console.log("student_internal_marks content:");
        console.table(res.rows);

        const workflowRes = await client.query(`SELECT * FROM marks_workflow_status LIMIT 20`);
        console.log("marks_workflow_status content:");
        console.table(workflowRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
}
run();
