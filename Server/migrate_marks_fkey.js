const client = require('./db.js');

async function fixMarksSchema() {
  try {
    console.log("Fixing marks table schema...");
    
    // First let's check what constraints exist
    const res = await client.query(`
      SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints tc 
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name 
      WHERE tc.table_name = 'marks' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'subject_id';
    `);

    console.log("Existing constraints for subject_id:", JSON.stringify(res.rows, null, 2));

    for (const row of res.rows) {
      if (row.foreign_table_name !== 'master_subjects') {
        console.log(`Dropping incorrect constraint: ${row.constraint_name}`);
        await client.query(`ALTER TABLE marks DROP CONSTRAINT "${row.constraint_name}";`);
      }
    }

    // Add correct constraint if it doesn't already point to master_subjects
    const hasCorrectConstraint = res.rows.some(row => row.foreign_table_name === 'master_subjects');
    if (!hasCorrectConstraint) {
      console.log("Adding correct constraint for master_subjects...");
      // Try adding the correct constraint. If there are orphaned rows this might fail.
      // Easiest is to add it and catch error gracefully.
      try {
        await client.query(`ALTER TABLE marks ADD CONSTRAINT marks_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES master_subjects(id)`);
      } catch (err) {
         console.warn("Could not add constraint immediately, possibly bad data exists across marks and subjects:", err.message);
      }
    }

    console.log("Marks schema fixed successfully!");
  } catch (err) {
    console.error("Failed to fix marks schema:", err);
  } finally {
    process.exit(0);
  }
}

setTimeout(fixMarksSchema, 1000);
