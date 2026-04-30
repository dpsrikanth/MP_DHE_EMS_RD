/**
 * Centralized grading and SGPA calculation utility.
 * This version is dynamic and relies on the grading policy fetched from the backend.
 */

/**
 * Determines the grade and grade points for a given mark based on the provided scale.
 * @param {number} marks - The marks obtained.
 * @param {Array} gradeScale - Array of {min, grade, points} sorted descending by min.
 * @returns {Object} { grade, gradePoint }
 */
export const getGradeAndPoints = (marks, gradeScale) => {
    if (!gradeScale || !Array.isArray(gradeScale)) {
        return { grade: 'F', gradePoint: 0 };
    }

    // Ensure scale is sorted descending by min value
    const sortedScale = [...gradeScale].sort((a, b) => b.min - a.min);

    for (const range of sortedScale) {
        if (marks >= range.min) {
            return { grade: range.grade, gradePoint: range.points };
        }
    }
    return { grade: 'F', gradePoint: 0 };
};

/**
 * Checks if a result is a pass based on marks and threshold.
 * @param {number} marks - The marks obtained.
 * @param {number} threshold - The pass threshold (e.g., 40).
 * @returns {boolean}
 */
export const isPass = (marks, threshold = 40) => {
    return marks >= threshold;
};

/**
 * Calculates SGPA based on subjects and grading configuration.
 * @param {Array} subjects - Array of student marks/subjects.
 * @param {Object} config - The grading configuration from the backend.
 * @returns {string} SGPA formatted to 2 decimal places.
 */
export const calculateSGPA = (subjects, config) => {
    if (!subjects || subjects.length === 0 || !config) return "0.00";

    const { grade_scale, calculate_sgpa_on_earned_only } = config;
    let totalCreditPoints = 0;
    let totalCredits = 0;

    subjects.forEach(subject => {
        const marks = subject.total_marks !== undefined ? Number(subject.total_marks) : (Number(subject.external_marks || 0) + Number(subject.internal_marks || 0) + Number(subject.grace_marks || 0));
        const { gradePoint } = getGradeAndPoints(marks, grade_scale);
        
        // Use university-specific credit override if available
        // Fallback to subject.credits or subject.credit
        const subjectId = subject.subject_id || subject.id;
        const overrideCredits = config.subject_credits?.[subjectId];
        const credits = overrideCredits !== undefined ? Number(overrideCredits) : Number(subject.credits || subject.credit || 0);

        if (calculate_sgpa_on_earned_only) {
            if (gradePoint > 0) {
                totalCreditPoints += (gradePoint * credits);
                totalCredits += credits;
            }
        } else {
            totalCreditPoints += (gradePoint * credits);
            totalCredits += credits;
        }
    });

    if (totalCredits === 0) return "0.00";
    return (totalCreditPoints / totalCredits).toFixed(2);
};
