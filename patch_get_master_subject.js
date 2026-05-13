const fs = require('fs');
const path = 'Server/controllers/controller.js';
let content = fs.readFileSync(path, 'utf8');

const target = `const getMasterSubject = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await client.query(
        \`SELECT id, subject_code, name, status, created_at,
                program_id, semester_id, mapping_type, is_mandatory, 
                has_examination, periods_per_week, teacher_id, credit
         FROM master_subjects 
         WHERE id = $1\`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Master subject not found" });
      res.json(result.rows[0]);
    } catch (error) {`;

const replacement = `const getMasterSubject = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await client.query(
        \`SELECT id, subject_code, name, status, created_at,
                program_id, semester_id, mapping_type, is_mandatory, 
                has_examination, periods_per_week, teacher_id, credit,
                COALESCE(
                   (SELECT json_agg(department_id) 
                    FROM master_subject_departments 
                    WHERE subject_id = master_subjects.id), 
                 '[]'::json) as department_ids
         FROM master_subjects 
         WHERE id = $1\`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Master subject not found" });
      res.json(result.rows[0]);
    } catch (error) {`;

// Normalize line endings for the check
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
    const patchedContent = normalizedContent.replace(normalizedTarget, replacement.replace(/\r\n/g, '\n'));
    // Convert back to original line endings if they were \r\n
    const finalContent = content.includes('\r\n') ? patchedContent.replace(/\n/g, '\r\n') : patchedContent;
    fs.writeFileSync(path, finalContent);
    console.log('Success: getMasterSubject now returns department_ids.');
} else {
    console.log('Target not found exactly. Trying regex...');
    // Try a more flexible regex
    const regex = /const getMasterSubject = async \(req, res\) => \{[\s\S]*?res\.json\(result\.rows\[0\]\);/g;
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(path, content);
        console.log('Success: getMasterSubject patched via regex.');
    } else {
        console.log('Target not found via regex either.');
    }
}
