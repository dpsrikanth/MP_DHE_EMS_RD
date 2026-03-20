const db = require('./db');

async function migrate() {
  try {
    console.log("Starting migration: Create grading_configs table...");
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS grading_configs (
          id SERIAL PRIMARY KEY,
          university_id INTEGER NOT NULL REFERENCES universities(id) UNIQUE,
          grade_scale JSONB NOT NULL,
          pass_threshold INTEGER DEFAULT 40,
          calculate_sgpa_on_earned_only BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Table 'grading_configs' created successfully.");

    // Seed default data for existing universities
    const universities = await db.query('SELECT id FROM universities');
    const defaultGradeScale = JSON.stringify([
        { min: 90, grade: 'O', points: 10 },
        { min: 80, grade: 'A+', points: 9 },
        { min: 70, grade: 'A', points: 8 },
        { min: 60, grade: 'B+', points: 7 },
        { min: 50, grade: 'B', points: 6 },
        { min: 40, grade: 'C', points: 5 },
        { min: 0, grade: 'F', points: 0 }
    ]);

    for (const uni of universities.rows) {
        await db.query(`
            INSERT INTO grading_configs (university_id, grade_scale, pass_threshold, calculate_sgpa_on_earned_only)
            VALUES ($1, $2, 40, false)
            ON CONFLICT (university_id) DO NOTHING
        `, [uni.id, defaultGradeScale]);
    }
    
    console.log(`Seeded default grading configs for ${universities.rows.length} universities.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
