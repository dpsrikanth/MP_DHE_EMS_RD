const client = require('../../db.js');

async function run() {
    try {
        const res = await client.query(`
      UPDATE students 
      SET "semister" = 'Semester 1' 
      WHERE "collageName" = 'Mp college' 
        AND "programName" = 'BTech' 
        AND "semister" = 'Semester 2'
      RETURNING id, "collageName", "programName", "semister"
    `);

        console.log(`Updated ${res.rowCount} students to Semester 1.`);
        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.end();
    }
}

run();
