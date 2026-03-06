const client = require('./db.js');

async function fixForeignKey() {
  try {
    console.log("Dropping old foreign key on exams table...");
    try {
        await client.query(`ALTER TABLE exams DROP CONSTRAINT exams_semester_id_fkey;`);
    } catch (e) {
        console.log("Constraint might be deleted already or a different name", e.message);
    }
    
    console.log("Adding correct foreign key to master_semesters...");
    await client.query(`ALTER TABLE exams ADD CONSTRAINT exams_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES master_semesters(id);`);
    
    console.log("Foreign Key fixed successfully!");
  } catch (err) {
    console.error("Failed to fix foreign key:", err);
  } finally {
    process.exit(0);
  }
}

setTimeout(fixForeignKey, 1000);
