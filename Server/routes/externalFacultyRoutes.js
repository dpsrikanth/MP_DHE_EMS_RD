const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { 
    getAssignedStudents, 
    saveExternalMarks, 
    finalizeExternalMarks,
    unlockExternalMarks,
    bulkUploadExternalMarks 
} = require('../controllers/externalFacultyController');

/**
 * @swagger
 * tags:
 *   name: External Examiner Operations
 *   description: Endpoints for external examiners to enter and finalize student marks
 */

/**
 * @swagger
 * /api/external-faculty/assignments:
 *   get:
 *     summary: Get students assigned to the external examiner
 *     tags: [External Examiner Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned students
 */
router.get('/assignments', verifyToken, getAssignedStudents);

/**
 * @swagger
 * /api/external-faculty/save-marks:
 *   post:
 *     summary: Save external marks for students
 *     tags: [External Examiner Operations]
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
 *     responses:
 *       200:
 *         description: Marks saved successfully
 */
router.post('/save-marks', verifyToken, saveExternalMarks);

/**
 * @swagger
 * /api/external-faculty/finalize-marks:
 *   post:
 *     summary: Finalize student marks for external examination
 *     tags: [External Examiner Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignmentId: { type: integer }
 *     responses:
 *       200:
 *         description: External marks finalized
 */
router.post('/finalize-marks', verifyToken, finalizeExternalMarks);

/**
 * @swagger
 * /api/external-faculty/unlock-subject:
 *   post:
 *     summary: Unlock a submitted subject for corrections
 *     tags: [External Examiner Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exam_ids: { type: array, items: { type: integer } }
 *               subject_ids: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Subject unlocked
 */
router.post('/unlock-subject', verifyToken, unlockExternalMarks);

/**
 * @swagger
 * /api/external-faculty/bulk-upload:
 *   post:
 *     summary: Bulk upload external marks via CSV
 *     tags: [External Examiner Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marks uploaded successfully
 */
router.post('/bulk-upload', verifyToken, bulkUploadExternalMarks);

module.exports = router;
