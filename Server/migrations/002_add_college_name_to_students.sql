-- Migration: Ensure collageName column exists in students table
-- This migration adds the collageName column if it doesn't exist

ALTER TABLE students ADD COLUMN IF NOT EXISTS "collageName" VARCHAR(255);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_collageName ON students("collageName");
