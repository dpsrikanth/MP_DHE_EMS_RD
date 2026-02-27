/**
 * Export local ems_db -> remote emsdb
 * 
 * This script:
 * 1. Connects to local PostgreSQL and reads all table schemas + data
 * 2. Connects to remote PostgreSQL and recreates everything
 * 
 * Usage: node export_db.js
 */
const { Client } = require('pg');

const LOCAL = {
  user: 'postgres',
  host: 'localhost',
  database: 'ems_db',
  password: '1234',
};

const REMOTE = {
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
};

async function run() {
  const local = new Client(LOCAL);
  const remote = new Client(REMOTE);

  try {
    console.log('Connecting to LOCAL database...');
    await local.connect();
    console.log('Connected to LOCAL.\n');

    console.log('Connecting to REMOTE database...');
    await remote.connect();
    console.log('Connected to REMOTE.\n');

    // Step 1: Get all user-created tables in dependency order
    console.log('--- Step 1: Reading table list from local DB ---');
    const tablesRes = await local.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const allTables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${allTables.length} tables: ${allTables.join(', ')}\n`);

    // Step 2: Get full CREATE TABLE DDL for each table
    console.log('--- Step 2: Extracting and recreating schema on REMOTE ---');

    // Drop all tables on remote first (in reverse dependency order)
    // Disable FK checks by dropping cascade
    for (const table of [...allTables].reverse()) {
      try {
        await remote.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      } catch (e) {
        // ignore
      }
    }
    console.log('Dropped existing tables on remote (if any).\n');

    // Get and run CREATE TABLE statements from local
    // We'll use pg_dump style: read column info + constraints
    for (const table of allTables) {
      // Get columns
      const colsRes = await local.query(`
        SELECT column_name, data_type, character_maximum_length,
               column_default, is_nullable, udt_name, 
               numeric_precision, numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      const colDefs = colsRes.rows.map(col => {
        let type = col.udt_name;
        // Map common types
        if (type === 'int4') type = 'INTEGER';
        else if (type === 'int8') type = 'BIGINT';
        else if (type === 'int2') type = 'SMALLINT';
        else if (type === 'float8') type = 'DOUBLE PRECISION';
        else if (type === 'float4') type = 'REAL';
        else if (type === 'bool') type = 'BOOLEAN';
        else if (type === 'varchar') type = `VARCHAR(${col.character_maximum_length || 255})`;
        else if (type === 'text') type = 'TEXT';
        else if (type === 'timestamp') type = 'TIMESTAMP';
        else if (type === 'timestamptz') type = 'TIMESTAMPTZ';
        else if (type === 'date') type = 'DATE';
        else if (type === 'numeric') type = `NUMERIC(${col.numeric_precision || 10},${col.numeric_scale || 2})`;
        else type = type.toUpperCase();

        let def = `"${col.column_name}" ${type}`;

        if (col.column_default) {
          // Handle serial/identity columns
          if (col.column_default.includes('nextval')) {
            def = `"${col.column_name}" SERIAL`;
          } else {
            def += ` DEFAULT ${col.column_default}`;
          }
        }

        if (col.is_nullable === 'NO' && !col.column_default?.includes('nextval')) {
          def += ' NOT NULL';
        }

        return def;
      });

      // Get primary key
      const pkRes = await local.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
        ORDER BY kcu.ordinal_position
      `, [table]);

      const pkCols = pkRes.rows.map(r => `"${r.column_name}"`);

      // Get unique constraints
      const uniqRes = await local.query(`
        SELECT kcu.column_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = $1
          AND tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = 'public'
      `, [table]);

      let constraints = [];
      if (pkCols.length > 0) {
        constraints.push(`PRIMARY KEY (${pkCols.join(', ')})`);
      }

      // Group unique constraints by constraint_name
      const uniqGroups = {};
      for (const u of uniqRes.rows) {
        if (!uniqGroups[u.constraint_name]) uniqGroups[u.constraint_name] = [];
        uniqGroups[u.constraint_name].push(`"${u.column_name}"`);
      }
      for (const [, cols] of Object.entries(uniqGroups)) {
        constraints.push(`UNIQUE (${cols.join(', ')})`);
      }

      const createSQL = `CREATE TABLE IF NOT EXISTS "${table}" (\n  ${[...colDefs, ...constraints].join(',\n  ')}\n);`;

      try {
        await remote.query(createSQL);
        console.log(`  ✓ Created table: ${table}`);
      } catch (err) {
        console.error(`  ✗ Error creating ${table}: ${err.message}`);
        console.error(`    SQL: ${createSQL.substring(0, 200)}...`);
      }
    }

    // Step 3: Add foreign keys after all tables are created
    console.log('\n--- Step 3: Adding foreign key constraints ---');
    const fkRes = await local.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    `);

    for (const fk of fkRes.rows) {
      const onDelete = fk.delete_rule !== 'NO ACTION' ? ` ON DELETE ${fk.delete_rule}` : '';
      const sql = `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}")${onDelete}`;
      try {
        await remote.query(sql);
        console.log(`  ✓ FK: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          // skip
        } else {
          console.error(`  ✗ FK error (${fk.constraint_name}): ${err.message}`);
        }
      }
    }

    // Step 4: Copy data
    console.log('\n--- Step 4: Copying data ---');
    for (const table of allTables) {
      try {
        const dataRes = await local.query(`SELECT * FROM "${table}"`);
        const rowCount = dataRes.rows.length;

        if (rowCount === 0) {
          console.log(`  - ${table}: 0 rows (skipped)`);
          continue;
        }

        const columns = dataRes.fields.map(f => `"${f.name}"`);

        // Disable triggers temporarily to avoid FK issues during insert
        await remote.query(`ALTER TABLE "${table}" DISABLE TRIGGER ALL`);

        // Insert rows in batches
        let inserted = 0;
        for (const row of dataRes.rows) {
          const values = dataRes.fields.map((f, i) => row[f.name]);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

          try {
            await remote.query(
              `INSERT INTO "${table}" (${columns.join(', ')}) VALUES (${placeholders})`,
              values
            );
            inserted++;
          } catch (err) {
            if (!err.message.includes('duplicate key')) {
              console.error(`    Row insert error in ${table}: ${err.message}`);
            }
          }
        }

        // Re-enable triggers
        await remote.query(`ALTER TABLE "${table}" ENABLE TRIGGER ALL`);

        // Reset sequence if table has a serial column
        try {
          const seqRes = await local.query(`
            SELECT column_name, column_default FROM information_schema.columns
            WHERE table_name = $1 AND column_default LIKE 'nextval%' AND table_schema = 'public'
          `, [table]);

          for (const seq of seqRes.rows) {
            const maxRes = await remote.query(`SELECT COALESCE(MAX("${seq.column_name}"), 0) + 1 as next_val FROM "${table}"`);
            const seqName = seq.column_default.match(/nextval\('([^']+)'/)?.[1];
            if (seqName) {
              await remote.query(`SELECT setval('${seqName}', ${maxRes.rows[0].next_val}, false)`);
            }
          }
        } catch (e) {
          // sequence sync is best-effort
        }

        console.log(`  ✓ ${table}: ${inserted}/${rowCount} rows copied`);
      } catch (err) {
        console.error(`  ✗ Error copying ${table}: ${err.message}`);
      }
    }

    // Step 5: Recreate the updated_at trigger function on remote
    console.log('\n--- Step 5: Creating audit trigger on remote ---');
    try {
      await remote.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $t$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $t$ language 'plpgsql';
      `);

      const triggerTables = [
        'users','universities','colleges','programs','academic_years',
        'semesters','subjects','roles','teachers','students',
        'exams','exam_types','marks',
        'master_policies','master_programs','master_subjects',
        'master_academic_years','master_semesters','master_roles'
      ];

      for (const tbl of triggerTables) {
        try {
          await remote.query(`DROP TRIGGER IF EXISTS set_updated_at ON "${tbl}"`);
          await remote.query(`CREATE TRIGGER set_updated_at BEFORE UPDATE ON "${tbl}" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
        } catch (e) { /* skip if table doesn't exist */ }
      }
      console.log('  ✓ Audit triggers created on remote.\n');
    } catch (err) {
      console.error('  Trigger error:', err.message);
    }

    console.log('========================================');
    console.log('  DATABASE EXPORT COMPLETE!');
    console.log('========================================');

  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await local.end().catch(() => {});
    await remote.end().catch(() => {});
  }
}

run();
