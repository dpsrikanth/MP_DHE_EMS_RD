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
    
    // Sync to corresponding college (university as a college)
    const collegeRes = await client.query(
      "SELECT id FROM colleges WHERE university_id = $1 AND name = (SELECT name FROM universities WHERE id = $1)",
      [id]
    );
    
    if (collegeRes.rows.length > 0) {
      const collegeId = collegeRes.rows[0].id;
      
      // Update College Policies
      if (policies !== undefined) {
        await client.query("DELETE FROM college_master_policies WHERE college_id = $1", [collegeId]);
        for (const policyId of policies) {
          await client.query("INSERT INTO college_master_policies (college_id, policy_id) VALUES ($1, $2)", [collegeId, policyId]);
        }
      }
      
      // Update College Programs
      if (programs !== undefined) {
        await client.query("DELETE FROM college_master_programs WHERE college_id = $1", [collegeId]);
        for (const programId of programs) {
          await client.query("INSERT INTO college_master_programs (college_id, program_id) VALUES ($1, $2)", [collegeId, programId]);
        }
      }
      
      // Update College Academic Years
      if (academicYears !== undefined) {
        await client.query("DELETE FROM college_master_academic_years WHERE college_id = $1", [collegeId]);
        for (const yearId of academicYears) {
          await client.query("INSERT INTO college_master_academic_years (college_id, academic_year_id) VALUES ($1, $2)", [collegeId, yearId]);
        }
      }
      
      // Update College Semesters
      if (semesters !== undefined) {
        await client.query("DELETE FROM college_master_semesters WHERE college_id = $1", [collegeId]);
        for (const semId of semesters) {
          await client.query("INSERT INTO college_master_semesters (college_id, semester_id) VALUES ($1, $2)", [collegeId, semId]);
        }
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

const getCollegeConfig = async (req, res) => {
  try {
    const { id } = req.params;
    
    const policies = await client.query("SELECT policy_id FROM college_master_policies WHERE college_id = $1", [id]);
    const programs = await client.query("SELECT program_id FROM college_master_programs WHERE college_id = $1", [id]);
    const academicYears = await client.query("SELECT academic_year_id FROM college_master_academic_years WHERE college_id = $1", [id]);
    const semesters = await client.query("SELECT semester_id FROM college_master_semesters WHERE college_id = $1", [id]);
    
    res.json({
      policies: policies.rows.map(r => r.policy_id),
      programs: programs.rows.map(r => r.program_id),
      academicYears: academicYears.rows.map(r => r.academic_year_id),
      semesters: semesters.rows.map(r => r.semester_id)
    });
  } catch (error) {
    console.error("Get college config error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCollegeConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { policies, programs, academicYears, semesters } = req.body;
    
    await client.query("BEGIN");
    
    if (policies !== undefined) {
      await client.query("DELETE FROM college_master_policies WHERE college_id = $1", [id]);
      for (const policyId of policies) {
        await client.query("INSERT INTO college_master_policies (college_id, policy_id) VALUES ($1, $2)", [id, policyId]);
      }
    }
    
    if (programs !== undefined) {
      await client.query("DELETE FROM college_master_programs WHERE college_id = $1", [id]);
      for (const programId of programs) {
        await client.query("INSERT INTO college_master_programs (college_id, program_id) VALUES ($1, $2)", [id, programId]);
      }
    }
    
    if (academicYears !== undefined) {
      await client.query("DELETE FROM college_master_academic_years WHERE college_id = $1", [id]);
      for (const yearId of academicYears) {
        await client.query("INSERT INTO college_master_academic_years (college_id, academic_year_id) VALUES ($1, $2)", [id, yearId]);
      }
    }
    
    if (semesters !== undefined) {
      await client.query("DELETE FROM college_master_semesters WHERE college_id = $1", [id]);
      for (const semId of semesters) {
        await client.query("INSERT INTO college_master_semesters (college_id, semester_id) VALUES ($1, $2)", [id, semId]);
      }
    }
    
    await client.query("COMMIT");
    res.json({ message: "College configuration updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update college config error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getMasters,
  getUniversityConfig,
  updateUniversityConfig,
  getCollegeConfig,
  updateCollegeConfig
};

