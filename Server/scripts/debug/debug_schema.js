const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function checkSchema() {
    try {
        console.log('--- Checking calculated_internal_marks ---');
        const res1 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'calculated_internal_marks'
            ORDER BY ordinal_position
        `);
        console.log('Columns:', res1.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

        console.log('\n--- Checking Constraints for calculated_internal_marks ---');
        const res2 = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_class rr ON c.conrelid = rr.oid 
            WHERE rr.relname = 'calculated_internal_marks'
        `);
        res2.rows.forEach(r => console.log(`${r.conname}: ${r.pg_get_constraintdef}`));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
