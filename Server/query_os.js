const client = require('./db.js');

async function run() {
    try {
        const res = await client.query(`
      SELECT id, subject_code, name 
      FROM master_subjects 
      WHERE name ILIKE '%operat%' OR name ILIKE '%system%'
    `);
        console.log("Master Subjects:");
        console.table(res.rows);

        const res2 = await client.query(`
      SELECT id, name, program_id, semester_id 
      FROM subjects 
      WHERE name ILIKE '%operat%' OR name ILIKE '%system%'
    `);
        console.log("Subjects:");
        console.table(res2.rows);

        const res3 = await client.query(`
      SELECT * FROM roles
    `);
        console.log("Roles:");
        console.table(res3.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.end();
    }
}

run();
