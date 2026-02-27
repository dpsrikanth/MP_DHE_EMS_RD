const client = require("../db");

const getMasters = async (req, res) => {
  try {
    const policies = await client.query("SELECT id, name FROM master_policies ORDER BY id");
    const programs = await client.query("SELECT id, name FROM master_programs ORDER BY id");
    const subjects = await client.query("SELECT id, name, subject_code FROM master_subjects ORDER BY id");
    const academicYears = await client.query("SELECT id, year_name FROM master_academic_years ORDER BY id");
    const semesters = await client.query("SELECT id, semester_name FROM master_semesters ORDER BY id");
    
    res.json({
      policies: policies.rows,
      programs: programs.rows,
      subjects: subjects.rows,
      academicYears: academicYears.rows,
      semesters: semesters.rows
    });
  } catch (error) {
    console.error("Get masters error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUniversityConfig = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch mapped policies
    const policies = await client.query(
      "SELECT policy_id FROM university_master_policies WHERE university_id = $1",
      [id]
    );
    
    // Fetch mapped programs
    const programs = await client.query(
      "SELECT program_id FROM university_master_programs WHERE university_id = $1",
      [id]
    );
    
    // Fetch mapped academic years
    const academicYears = await client.query(
      "SELECT academic_year_id FROM university_master_academic_years WHERE university_id = $1",
      [id]
    );
    
    // Fetch mapped semesters
    const semesters = await client.query(
      "SELECT semester_id FROM university_master_semesters WHERE university_id = $1",
      [id]
    );
    
    res.json({
      policies: policies.rows.map(r => r.policy_id),
      programs: programs.rows.map(r => r.program_id),
      academicYears: academicYears.rows.map(r => r.academic_year_id),
      semesters: semesters.rows.map(r => r.semester_id)
    });
  } catch (error) {
    console.error("Get university config error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUniversityConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { policies, programs, academicYears, semesters } = req.body;
    
    await client.query("BEGIN");
    
    // Update Policies
    if (policies !== undefined) {
      await client.query("DELETE FROM university_master_policies WHERE university_id = $1", [id]);
      for (const policyId of policies) {
        await client.query(
          "INSERT INTO university_master_policies (university_id, policy_id) VALUES ($1, $2)",
          [id, policyId]
        );
      }
    }
    
    // Update Programs
    if (programs !== undefined) {
      await client.query("DELETE FROM university_master_programs WHERE university_id = $1", [id]);
      for (const programId of programs) {
        await client.query(
          "INSERT INTO university_master_programs (university_id, program_id) VALUES ($1, $2)",
          [id, programId]
        );
      }
    }
    
    // Update Academic Years
    if (academicYears !== undefined) {
      await client.query("DELETE FROM university_master_academic_years WHERE university_id = $1", [id]);
      for (const yearId of academicYears) {
        await client.query(
          "INSERT INTO university_master_academic_years (university_id, academic_year_id) VALUES ($1, $2)",
          [id, yearId]
        );
      }
    }
    
    // Update Semesters
    if (semesters !== undefined) {
      await client.query("DELETE FROM university_master_semesters WHERE university_id = $1", [id]);
      for (const semId of semesters) {
        await client.query(
          "INSERT INTO university_master_semesters (university_id, semester_id) VALUES ($1, $2)",
          [id, semId]
        );
      }
    }
    
    await client.query("COMMIT");
    res.json({ message: "Configuration updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update university config error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getMasters,
  getUniversityConfig,
  updateUniversityConfig
};
