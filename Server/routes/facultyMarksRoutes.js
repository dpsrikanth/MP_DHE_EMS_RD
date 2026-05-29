const express = require('express');
const router = express.Router();
const facultyMarksController = require('../controllers/facultyMarksController');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// Faculty check middleware could be added here
const isFaculty = (req, res, next) => {
    next();
};
router.use(isFaculty);

/**
 * @swagger
 * tags:
 *   name: Faculty Operations
 *   description: Endpoints for teachers to enter and manage student marks
 */

// Fetch assigned subjects
/**
 * @swagger
 * /api/faculty-marks/assigned-subjects/{teacher_id}:
 *   get:
 *     summary: Get subjects assigned to a specific teacher
 *     tags: [Faculty Operations]
 *     parameters:
 *       - in: path
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned subjects
 */
router.get('/assigned-subjects/:teacher_id', facultyMarksController.getAssignedSubjects);

// Fetch students for a specific program/semester
/**
 * @swagger
 * /api/faculty-marks/students:
 *   get:
 *     summary: Get student list for marks entry
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/students', facultyMarksController.getStudentsForSubject);

/**
 * @swagger
 * /api/faculty-marks/entered-marks:
 *   get:
 *     summary: Get previously entered marks for a subject batch
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/entered-marks', facultyMarksController.getEnteredMarks);
router.get('/exam-rounds', facultyMarksController.getAvailableRounds);
router.get('/students-for-round', facultyMarksController.getStudentsForRound);

/**
 * @swagger
 * /api/faculty-marks/enter-marks:
 *   post:
 *     summary: Save student marks as a draft
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               marksData: { type: array, items: { type: object } }
 *               subject_id: { type: integer }
 *               academic_year_id: { type: integer }
 *               semester_id: { type: integer }
 *     responses:
 *       200:
 *         description: Marks saved as draft
 */
router.post('/enter-marks', facultyMarksController.enterStudentMarks);

/**
 * @swagger
 * /api/faculty-marks/submit-marks:
 *   post:
 *     summary: Submit finalized marks for HOD approval
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_id: { type: integer }
 *               academic_year_id: { type: integer }
 *               semester_id: { type: integer }
 *     responses:
 *       200:
 *         description: Marks submitted successfully
 */
router.post('/submit-marks', facultyMarksController.submitMarks);

/**
 * @swagger
 * /api/faculty-marks/attendance:
 *   get:
 *     summary: Get attendance for a subject, section, and date
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Save attendance records
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/attendance', facultyMarksController.getAttendance);
router.post('/attendance', facultyMarksController.saveAttendance);
router.post('/attendance/bulk-generate', facultyMarksController.bulkAddAttendance);

/**
 * @swagger
 * /api/faculty-marks/attendance-summary:
 *   get:
 *     summary: Get an aggregate overview of student attendance
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/attendance-summary', facultyMarksController.getAttendanceSummary);

/**
 * @swagger
 * /api/faculty-marks/request-unlock:
 *   post:
 *     summary: Request HOD to unlock submitted marks for correction
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/publish-round', facultyMarksController.publishRoundMarks);
router.post('/request-round-unlock', facultyMarksController.requestRoundUnlock);
router.post('/request-unlock', facultyMarksController.requestUnlock);
router.post('/bulk-upload', facultyMarksController.bulkUploadInternalMarks);
router.get('/pending-discrepancies', facultyMarksController.getPendingDiscrepancies);
router.post('/resolve-discrepancy', facultyMarksController.resolveDiscrepancy);

// --- Invigilation Duties ---
router.get('/invigilation/duties', facultyMarksController.getInvigilationDuties);
router.get('/invigilation/hall-students', facultyMarksController.getInvigilationHallStudents);
router.post('/invigilation/attendance/save', facultyMarksController.saveExternalAttendance);

module.exports = router;

