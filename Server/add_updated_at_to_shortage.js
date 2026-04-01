const db = require('./db');

async function alterTable() {
  try {
    console.log("Checking if updated_at exists...");
    const checkRes = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shortage_requests' AND column_name = 'updated_at'
    `);

    if (checkRes.rowCount === 0) {
      console.log("Adding updated_at column to shortage_requests...");
      await db.query("ALTER TABLE shortage_requests ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
      console.log("Column added successfully.");
    } else {
      console.log("updated_at column already exists.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

alterTable();
