const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
});

async function run() {
  await client.connect();
  console.log('Connected.');

  const sql = fs.readFileSync('./add_audit_columns.sql', 'utf8');

  // Split by semicolons but keep DO $$ blocks intact
  const statements = [];
  let current = '';
  let inDollar = false;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed === '') {
      continue;
    }

    current += line + '\n';

    if (trimmed.includes('$$') && !inDollar) {
      inDollar = true;
    } else if (trimmed.includes('$$') && inDollar) {
      // Check if we're closing a DO block
      if (trimmed.endsWith(';') || trimmed === '$$;') {
        inDollar = false;
      }
    }

    if (!inDollar && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      success++;
    } catch (err) {
      if (err.message.includes('already exists')) {
        skipped++;
      } else {
        errors++;
        console.error('Error on statement:', stmt.substring(0, 80) + '...');
        console.error('  ->', err.message);
      }
    }
  }

  console.log(`\nDone! ${success} succeeded, ${skipped} skipped (already exist), ${errors} errors.`);
  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
