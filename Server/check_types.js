const client = require('./db');
async function check() {
  try {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'master_policies'");
    console.log("master_policies columns:", res.rows);
    const res2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'master_teachers'");
    console.log("master_teachers columns:", res2.rows);
  } finally {
    client.end();
  }
}
check();
