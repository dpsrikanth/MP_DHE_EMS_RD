const client = require('./db');

async function run() {
    try {
        const res = await client.query(`
            SELECT * FROM internal_marks_structure 
            WHERE subject_id = 6
        `);
        console.log("Marks Structure for Subject #6:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
}
run();
