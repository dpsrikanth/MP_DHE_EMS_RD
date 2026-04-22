const client = require('../../db');
async function run() {
  try {
    const user = await client.query("SELECT university_id FROM users WHERE email = 'admin@example.com'");
    const univId = user.rows[0]?.university_id;
    console.log('User Univ ID:', univId);
    
    if (univId) {
      const res1 = await client.query('UPDATE master_subjects SET university_id = $1 WHERE university_id IS NULL', [univId]);
      console.log('master_subjects updated:', res1.rowCount);
      const res2 = await client.query('UPDATE subjects SET university_id = $1 WHERE university_id IS NULL', [univId]);
      console.log('subjects updated:', res2.rowCount);
    } else {
      console.error('No university_id found for admin@example.com');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
