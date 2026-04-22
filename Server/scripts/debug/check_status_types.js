const client = require('../../db');
async function check() {
  try {
    const tables = ['master_teachers', 'colleges', 'exams', 'master_programs', 'master_semesters', 'master_subjects', 'master_academic_years', 'master_policies'];
    for (const table of tables) {
      const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 AND column_name = 'status'", [table]);
      console.log(`${table}.status:`, res.rows[0]?.data_type || 'NONE');
    }
  } finally {
    client.end();
  }
}
check();
