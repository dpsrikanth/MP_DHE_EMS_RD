/**
 * exportUtils.js
 * Generic CSV export utilities — no external libraries required.
 * Uses the browser's built-in Blob + URL API.
 */

/**
 * Convert an array of objects to a CSV string.
 * @param {Object[]} data - Array of row objects
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 * @returns {string} CSV content
 */
const buildCSV = (data, columns) => {
    const header = columns.map(col => `"${col.label}"`).join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const val = row[col.key] ?? '';
            // Escape double quotes and wrap in quotes
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
    );
    return [header, ...rows].join('\r\n');
};

/**
 * Trigger a browser download of a CSV file.
 * @param {string} csvContent - The CSV string
 * @param {string} filename - File name (without extension)
 */
const downloadCSV = (csvContent, filename) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Generic export: data[] + column definitions → CSV download
 * @param {Object[]} data
 * @param {Array<{key: string, label: string}>} columns
 * @param {string} filename
 */
export const exportToCSV = (data, columns, filename) => {
    if (!data || data.length === 0) return;
    const csv = buildCSV(data, columns);
    downloadCSV(csv, filename);
};

/**
 * Export marks report to CSV
 * @param {Object[]} data - Marks report rows
 * @param {string} filename
 */
export const exportMarksCSV = (data, filename = 'marks_report') => {
    const columns = [
        { key: 'enrollmentNo', label: 'Enrollment No' },
        { key: 'rollnumber', label: 'Roll Number' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'subject_code', label: 'Subject Code' },
        { key: 'subject_name', label: 'Subject Name' },
        { key: 'best_of_3_score', label: 'IA (Best of 2)' },
        { key: 'practical_score', label: 'Practical' },
        { key: 'total_internal', label: 'Total (IA+P)' },
        { key: 'passing_status', label: 'Status' },
        { key: 'academic_year', label: 'Academic Year' },
    ];
    exportToCSV(data, columns, filename);
};

/**
 * Export attendance shortage report to CSV
 * @param {Object[]} data
 * @param {string} filename
 */
export const exportAttendanceCSV = (data, filename = 'attendance_shortage_report') => {
    const columns = [
        { key: 'enrollment_no', label: 'Enrollment No' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'program_name', label: 'Program' },
        { key: 'semester_name', label: 'Semester' },
        { key: 'subject_name', label: 'Subject' },
        { key: 'total_sessions', label: 'Total Sessions' },
        { key: 'attended_sessions', label: 'Attended' },
        { key: 'attendance_percentage', label: 'Attendance %' },
        { key: 'status', label: 'Status' },
    ];
    exportToCSV(data, columns, filename);
};

/**
 * Export result summary to CSV
 * @param {Object[]} data
 * @param {string} filename
 */
export const exportResultCSV = (data, filename = 'result_summary') => {
    const columns = [
        { key: 'enrollment_no', label: 'Enrollment No' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'program_name', label: 'Program' },
        { key: 'semester_name', label: 'Semester' },
        { key: 'total_marks', label: 'Total Marks' },
        { key: 'max_marks', label: 'Max Marks' },
        { key: 'percentage', label: 'Percentage' },
        { key: 'status', label: 'Pass/Fail' },
        { key: 'grade', label: 'Grade' },
    ];
    exportToCSV(data, columns, filename);
};

/**
 * Export institutional ranking to CSV
 * @param {Object[]} data
 * @param {string} filename
 */
export const exportRankingCSV = (data, filename = 'institutional_ranking') => {
    const columns = [
        { key: 'rank', label: 'Rank' },
        { key: 'college_name', label: 'College Name' },
        { key: 'total_marks_entered', label: 'Total Students' },
        { key: 'passed_count', label: 'Passed' },
        { key: 'pass_percentage', label: 'Pass %' },
    ];
    exportToCSV(data, columns, filename);
};
