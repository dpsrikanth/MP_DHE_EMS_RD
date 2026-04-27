const pool = require("../db");

const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const result = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = $1", [key]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Setting not found" });
        }
        
        res.json(result.rows[0].setting_value);
    } catch (error) {
        console.error("Get setting error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        
        const result = await pool.query(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP RETURNING *",
            [key, JSON.stringify(value)]
        );
        
        res.json({ message: "Setting updated successfully", setting: result.rows[0] });
    } catch (error) {
        console.error("Update setting error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getSetting,
    updateSetting
};
