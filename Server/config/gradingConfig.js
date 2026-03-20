// Grading Configuration for MP DHE EMS
// This file centralizes the grading scale, grade points, and passing criteria.
// Universities can modify these values to change how results are calculated.

const gradingConfig = {
  // Pass/Fail Criteria
  PASS_THRESHOLD: 40, // Minimum total marks (Internal + External) to pass

  // Grade Scale (Inclusive lower bound)
  // Format: { min: <marks>, grade: <string>, points: <number> }
  GRADE_SCALE: [
    { min: 90, grade: 'O', points: 10 },
    { min: 80, grade: 'A+', points: 9 },
    { min: 70, grade: 'A', points: 8 },
    { min: 30, grade: 'B+', points: 7 },
    { min: 50, grade: 'B', points: 6 },
    { min: 40, grade: 'C', points: 5 },
    { min: 0, grade: 'F', points: 0 }
  ],

  // SGPA Formula: Σ(Grade Points * Credits) / Σ(Total Registered Credits)
  // Note: Failed subjects contribute 0 Grade Points but their credits are included in the denominator.
  CALCULATE_SGPA_ON_EARNED_ONLY: false // Set to true if denominator should only include passed subjects
};

module.exports = gradingConfig;
