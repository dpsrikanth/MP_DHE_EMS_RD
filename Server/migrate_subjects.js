const client = require('./db');
async function run() {
  try {
    console.log('Starting migration...');
    await client.query('ALTER TABLE master_subjects ADD COLUMN IF NOT EXISTS university_id INTEGER');
    console.log('master_subjects updated');
    await client.query('ALTER TABLE subjects ADD COLUMN IF NOT EXISTS university_id INTEGER');
    console.log('subjects updated');
    
    const res = await client.query("SELECT id FROM universities WHERE name = 'MP University'");
    if (res.rows.length > 0) {
      const univId = res.rows[0].id;
      await client.query('UPDATE master_subjects SET university_id = $1 WHERE university_id IS NULL', [univId]);
      await client.query('UPDATE subjects SET university_id = $1 WHERE university_id IS NULL', [univId]);
      console.log('Existing records migrated to university_id:', univId);
    }
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit();
  }
}
run();
