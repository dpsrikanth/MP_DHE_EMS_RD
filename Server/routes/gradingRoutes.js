const express = require('express');
const router = express.Router();
const gradingController = require('../controllers/gradingController');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Grading System
 *   description: Centralized configuration for GPA, SGPA, and grade point scales
 */

// Public/Student access to GET (if needed) - can be restricted to verifyToken
/**
 * @swagger
 * /api/grading/config:
 *   get:
 *     summary: Get current grading configuration (scales and thresholds)
 *     tags: [Grading System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grading configuration data
 */
router.get('/config', verifyToken, gradingController.getGradingConfig);

/**
 * @swagger
 * /api/grading/config:
 *   post:
 *     summary: Update the grading configuration (Super Admin only)
 *     tags: [Grading System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GradingConfig'
 *     responses:
 *       200:
 *         description: Grading configuration updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/config', verifyToken, gradingController.updateGradingConfig);

/**
 * @swagger
 * /api/grading/subjects:
 *   get:
 *     summary: Get all subjects available for grading configuration
 *     tags: [Grading System]
 *     security:
 *       - bearerAuth: []
 */
router.get('/subjects', verifyToken, gradingController.getSubjectsForConfig);

module.exports = router;
