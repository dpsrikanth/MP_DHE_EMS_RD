const client = require('./db');

async function checkSchema() {
  try {
    console.log("--- semesters Table ---");
    const semestersSchema = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'semesters'"
    );
    console.table(semestersSchema.rows);

    console.log("\n--- master_semesters Table ---");
    const masterSemestersSchema = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'master_semesters'"
    );
    console.table(masterSemestersSchema.rows);

    console.log("\n--- master_academic_years Table ---");
    const masterAcademicYearsSchema = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'master_academic_years'"
    );
    console.table(masterAcademicYearsSchema.rows);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSchema();
