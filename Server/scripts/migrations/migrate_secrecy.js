const pool = require('../../db');

async function migrateSecrecy() {
  const client = await pool.connect();
  try {
    console.log("Starting Secrecy migration...");

    // 1. Add Secrecy Role
    await client.query(`
      INSERT INTO roles (role_name) 
      VALUES ('Secrecy') 
      ON CONFLICT (role_name) DO NOTHING;
    `);
    console.log("Secrecy role added (if not exists).");

    // 2. Add Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS paper_setter_payments (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES paper_assignments(id) ON DELETE CASCADE,
        paper_setter_id INTEGER REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending', -- Pending, Processing, Paid
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("paper_setter_payments table created.");

    // 3. Add Feedback column to paper_assignments if missing
    await client.query(`
      ALTER TABLE paper_assignments 
      ADD COLUMN IF NOT EXISTS feedback TEXT,
      ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMP;
    `);
    console.log("paper_assignments columns updated.");

    console.log("Secrecy migration completed successfully.");
  } catch (err) {
    console.error("Error during Secrecy migration:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrateSecrecy();
