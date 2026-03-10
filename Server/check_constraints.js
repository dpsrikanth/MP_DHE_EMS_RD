const client = require('./db');

async function run() {
    try {
        const res = await client.query(`
            SELECT
                conname AS constraint_name,
                pg_get_constraintdef(con.oid) AS constraint_definition
            FROM
                pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE
                rel.relname = 'student_internal_marks';
        `);
        console.log("Constraints for student_internal_marks:");
        res.rows.forEach(r => {
            console.log(`${r.constraint_name}: ${r.constraint_definition}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
}
run();
