const client = require('../../db');
async function testConn() {
  try {
    const res = await client.query("SELECT 1");
    console.log("Connection successful:", res.rows);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    process.exit(0);
  }
}
testConn();
