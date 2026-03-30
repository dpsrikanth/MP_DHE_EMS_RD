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

/**
 * @swagger
 * /api/faculty-marks/enter-marks:
 *   post:
 *     summary: Save student marks as a draft
 *     tags: [Faculty Operations]
 *     security:
 *       - bearerAuth: []
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
 */
router.post('/submit-marks', facultyMarksController.submitMarks);

module.exports = router;
