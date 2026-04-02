const client = require('./db');
async function run() {
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'colleges'
      ORDER BY ordinal_position
    `);
    console.log('Colleges columns:', res.rows.map(r => r.column_name + ' (' + r.data_type + ')'));

    // Also test the actual join used in hall ticket
    const test = await client.query(`
      SELECT 
        home_col.id, home_col.name, home_col.sitting_center_id,
        center_col.name as center_name
      FROM colleges home_col
      LEFT JOIN colleges center_col ON home_col.sitting_center_id = center_col.id
      LIMIT 5
    `);
    console.log('Sample join result:', test.rows);
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}
run();
