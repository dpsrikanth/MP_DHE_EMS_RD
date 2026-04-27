const pool = require("../db");

const getMilestones = async (req, res) => {
  try {
    const { semester_id, program_id, academic_year_id, college_id } = req.query;
    let query = "SELECT * FROM academic_milestones WHERE delete_status = true";
    const params = [];

    if (semester_id && semester_id !== 'undefined') {
      query += " AND (semester_id = $" + (params.length + 1) + " OR semester_id IS NULL)";
      params.push(semester_id);
    }

    if (program_id && program_id !== 'undefined') {
      query += " AND (program_id = $" + (params.length + 1) + " OR program_id IS NULL)";
      params.push(program_id);
    }

    if (academic_year_id && academic_year_id !== 'undefined') {
      query += " AND (academic_year_id = $" + (params.length + 1) + " OR academic_year_id IS NULL)";
      params.push(academic_year_id);
    }

    if (college_id && college_id !== 'undefined') {
      query += " AND (college_id = $" + (params.length + 1) + " OR college_id IS NULL)";
      params.push(college_id);
    }

    query += " ORDER BY start_date ASC";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get milestones error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMilestone = async (req, res) => {
  try {
    const { name, start_date, end_date, responsibility, type, description, semester_id, program_id, academic_year_id, college_id } = req.body;
    
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ message: "Name, start date, and end date are required" });
    }

    const result = await pool.query(
      "INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type, description, semester_id, program_id, academic_year_id, college_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [name, start_date, end_date, responsibility, type, description, semester_id, program_id, academic_year_id, college_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create milestone error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, responsibility, type, description, semester_id, program_id, academic_year_id, college_id } = req.body;

    const result = await pool.query(
      "UPDATE academic_milestones SET name = $1, start_date = $2, end_date = $3, responsibility = $4, type = $5, description = $6, semester_id = $7, program_id = $8, academic_year_id = $9, college_id = $10 WHERE id = $11 RETURNING *",
      [name, start_date, end_date, responsibility, type, description, semester_id, program_id, academic_year_id, college_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update milestone error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE academic_milestones SET delete_status = false WHERE id = $1", [id]);
    res.json({ message: "Milestone deleted successfully" });
  } catch (error) {
    console.error("Delete milestone error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const cloneMilestones = async (req, res) => {
  try {
    const { source_semester_id, target_semester_id, academic_year_id, program_id, college_id, new_start_date } = req.body;

    if (!source_semester_id || !target_semester_id || !new_start_date) {
      return res.status(400).json({ message: "Source, Target, and New Start Date are required" });
    }

    // 1. Fetch source milestones
    const sourceRes = await pool.query(
      "SELECT * FROM academic_milestones WHERE semester_id = $1 AND delete_status = true ORDER BY start_date ASC",
      [source_semester_id]
    );

    if (sourceRes.rows.length === 0) {
      return res.status(404).json({ message: "No milestones found in source semester" });
    }

    const sourceMilestones = sourceRes.rows;
    const sourceAnchorDate = new Date(sourceMilestones[0].start_date);
    const targetAnchorDate = new Date(new_start_date);

    // 2. Clone and shift dates
    const values = [];
    for (const ms of sourceMilestones) {
      const startMs = new Date(ms.start_date);
      const endMs = new Date(ms.end_date);

      const startOffset = startMs.getTime() - sourceAnchorDate.getTime();
      const endOffset = endMs.getTime() - sourceAnchorDate.getTime();

      const newStart = new Date(targetAnchorDate.getTime() + startOffset);
      const newEnd = new Date(targetAnchorDate.getTime() + endOffset);

      values.push({
        name: ms.name,
        start_date: newStart.toISOString(),
        end_date: newEnd.toISOString(),
        responsibility: ms.responsibility,
        type: ms.type,
        description: ms.description,
        semester_id: target_semester_id,
        program_id: program_id || ms.program_id,
        academic_year_id: academic_year_id || ms.academic_year_id,
        college_id: college_id || ms.college_id
      });
    }

    // 3. Batch Insert
    // For simplicity, we'll insert them one by one or construct a large query. 
    // Constructing a single query with multiple rows is more efficient.
    const queryParts = [];
    const params = [];
    values.forEach((v, i) => {
      const idx = i * 10;
      queryParts.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10})`);
      params.push(v.name, v.start_date, v.end_date, v.responsibility, v.type, v.description, v.semester_id, v.program_id, v.academic_year_id, v.college_id);
    });

    const insertQuery = `
      INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type, description, semester_id, program_id, academic_year_id, college_id)
      VALUES ${queryParts.join(", ")}
      RETURNING *
    `;

    const result = await pool.query(insertQuery, params);
    res.status(201).json({ message: `Successfully cloned ${result.rowCount} milestones`, data: result.rows });

  } catch (error) {
    console.error("Clone milestones error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  cloneMilestones
};
