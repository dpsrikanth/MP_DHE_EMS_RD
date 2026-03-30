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
