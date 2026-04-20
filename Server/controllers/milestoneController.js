const pool = require("../db");

const getMilestones = async (req, res) => {
  try {
    const { semester_id, college_id } = req.query;
    let query = "SELECT * FROM academic_milestones WHERE delete_status = true";
    const params = [];

    if (semester_id) {
      query += " AND (semester_id = $" + (params.length + 1) + " OR semester_id IS NULL)";
      params.push(semester_id);
    }

    if (college_id) {
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
    const { name, start_date, end_date, responsibility, type, description, semester_id, college_id } = req.body;
    
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ message: "Name, start date, and end date are required" });
    }

    const result = await pool.query(
      "INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type, description, semester_id, college_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [name, start_date, end_date, responsibility, type, description, semester_id, college_id]
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
    const { name, start_date, end_date, responsibility, type, description, semester_id, college_id } = req.body;

    const result = await pool.query(
      "UPDATE academic_milestones SET name = $1, start_date = $2, end_date = $3, responsibility = $4, type = $5, description = $6, semester_id = $7, college_id = $8 WHERE id = $9 RETURNING *",
      [name, start_date, end_date, responsibility, type, description, semester_id, college_id, id]
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

module.exports = {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
};
