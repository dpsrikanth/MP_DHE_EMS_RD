#!/usr/bin/env node
/**
 * Minimal forward-only migration runner.
 *
 * - Applies every *.sql file in this directory, in filename order.
 * - Records applied files in a `schema_migrations` table, so re-running only
 *   applies what is new (idempotent).
 * - Each file runs inside its own transaction; a failure rolls that file back
 *   and stops the run.
 *
 * Usage:  npm run migrate
 *
 * NOTE: legacy *.js migrations in this folder are NOT picked up — run those
 * manually. New migrations should be plain .sql.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../config/.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function run() {
  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const appliedRes = await client.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedRes.rows.map((r) => r.filename));

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`Applying ${file} ...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        count++;
        console.log(`  ✔ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  x ${file} failed: ${err.message}`);
        throw err;
      }
    }

    console.log(count === 0 ? 'Nothing to apply — schema is up to date.' : `Applied ${count} migration(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration run failed:', err.message);
  process.exit(1);
});
