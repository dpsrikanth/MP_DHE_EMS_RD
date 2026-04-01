const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { 
    getFacultiesForExternal, 
    getRegistrationsPendingAssignment, 
    assignExternalFaculty, 
    getExternalAssignments,
    getFinalizedExternalMarks,
    getResultHubData,
    getCollegesMapping,
    updateSittingCenter
} = require('../controllers/universityAdminController');

/**
 * @swagger
 * tags:
 *   name: University Administration
 *   description: High-level administration for external faculty and exam systems
 */

/**
 * @swagger
 * /api/university-admin/external-faculties:
 *   get:
 *     summary: List all faculty members available for external assignment
 *     tags: [University Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of faculties
 */
router.get('/external-faculties', verifyToken, getFacultiesForExternal);

/**
 * @swagger
 * /api/university-admin/pending-external-assignments:
 *   get:
 *     summary: Get exam registrations awaiting external examiner assignment
 *     tags: [University Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending registrations
 */
router.get('/pending-external-assignments', verifyToken, getRegistrationsPendingAssignment);
/**
 * @swagger
 * /api/university-admin/assign-external-faculty:
 *   post:
 *     summary: Assign a faculty member as an external examiner to a college subject
 *     tags: [University Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacherId: { type: integer }
 *               registrationId: { type: integer }
 *               examId: { type: integer }
 *     responses:
 *       200:
 *         description: Faculty assigned successfully
 */
router.post('/assign-external-faculty', verifyToken, assignExternalFaculty);

/**
 * @swagger
 * /api/university-admin/external-assignments:
 *   get:
 *     summary: Get all active external faculty assignments
 *     tags: [University Administration]
 *     security:
 *       - bearerAuth: []
 */
router.get('/external-assignments', verifyToken, getExternalAssignments);

/**
 * @swagger
 * /api/university-admin/finalized-external-marks:
 *   get:
 *     summary: Monitor external marks that have been finalized by examiners
 *     tags: [University Administration]
 *     security:
 *       - bearerAuth: []
 */
router.get('/finalized-external-marks', verifyToken, getFinalizedExternalMarks);

/**
 * @swagger
 * /api/university-admin/result-hub-data:
 *   get:
 *     summary: Get comprehensive marks data for the Result Hub with optional filters
 *     tags: [University Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam_id
 *         schema: { type: integer }
 *       - in: query
 *         name: college_id
 *         schema: { type: integer }
 *       - in: query
 *         name: program_id
 *         schema: { type: integer }
 */
router.get('/result-hub-data', verifyToken, getResultHubData);

/**
 * @swagger
 * /api/university-admin/center-mapping:
 *   get:
 *     summary: Get all colleges and their designated examination sitting centers
 *     tags: [University Administration]
 *     security:
 *       - bearerAuth: []
 */
router.get('/center-mapping', verifyToken, getCollegesMapping);

/**
 * @swagger
 * /api/university-admin/center-mapping/{collegeId}:
 *   put:
 *     summary: Update the sitting center for a college
 *     tags: [University Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collegeId
 *         required: true
 *         schema: { type: integer }
 */
router.put('/center-mapping/:collegeId', verifyToken, updateSittingCenter);

module.exports = router;
