const client = require('../../db');
async function run() {
  try {
    const user = await client.query("SELECT university_id FROM users WHERE email = 'admin@example.com'");
    console.log('USER_UNIV_ID:', user.rows[0]?.university_id);
    
    const col = await client.query("SELECT id, name, university_id FROM colleges WHERE name ILIKE '%BARKATULLAH%'");
    console.log('BARKATULLAH_COLLEGES:', JSON.stringify(col.rows, null, 2));

    const univs = await client.query("SELECT id, name FROM universities");
    console.log('ALL_UNIVERSITIES:', JSON.stringify(univs.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
