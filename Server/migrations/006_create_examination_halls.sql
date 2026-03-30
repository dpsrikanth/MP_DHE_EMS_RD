CREATE TABLE IF NOT EXISTS examination_halls (
    id SERIAL PRIMARY KEY,
    hall_code VARCHAR(50) NOT NULL,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    rows INTEGER NOT NULL,
    seats_per_row INTEGER NOT NULL,
    total_capacity INTEGER GENERATED ALWAYS AS (rows * seats_per_row) STORED,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hall_code, college_id)
);
