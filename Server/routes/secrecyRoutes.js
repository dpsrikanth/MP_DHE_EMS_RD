const express = require('express');
const router = express.Router();
const secrecyController = require('../controllers/secrecyController');
const { verifyToken } = require('../middleware/auth.middleware.js');

router.use(verifyToken);

// Role Middleware
const checkRole = (roles) => (req, res, next) => {
  const userRole = req.user?.roleName || req.user?.role || '';
  if (!roles.includes(userRole)) {
    return res.status(403).json({ message: 'Forbidden: Insufficient privileges.' });
  }
  next();
};

const secrecyOnly = checkRole(['Secrecy', 'admin', 'SUPER_ADMIN']);

/**
 * @swagger
 * tags:
 *   name: Secrecy Department
 *   description: Management of paper setters, question paper reviews, and faculty payments
 */

// Dashboard Stats & Activity
/**
 * @swagger
 * /api/secrecy/stats:
 *   get:
 *     summary: Get dashboard statistics for the Secrecy department
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics data
 */
router.get('/stats', secrecyOnly, secrecyController.getDashboardStats);

/**
 * @swagger
 * /api/secrecy/activity:
 *   get:
 *     summary: Get recent system activity related to Secrecy
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 */
router.get('/activity', secrecyOnly, secrecyController.getRecentActivity);

// Paper Setters Management
/**
 * @swagger
 * /api/secrecy/setters:
 *   get:
 *     summary: List all authenticated paper setters and their subjects
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of paper setters
 */
router.get('/setters', secrecyOnly, secrecyController.getPaperSetters);

/**
 * @swagger
 * /api/secrecy/setters/add:
 *   post:
 *     summary: Authorize an existing faculty member as a paper setter
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 */
router.post('/setters/add', secrecyOnly, secrecyController.addPaperSetter);

/**
 * @swagger
 * /api/secrecy/setters/new:
 *   post:
 *     summary: Create and authorize a new paper setter account
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 */
router.post('/setters/new', secrecyOnly, secrecyController.createNewSetter);

/**
 * @swagger
 * /api/secrecy/setters/{id}:
 *   put:
 *     summary: Update paper setter details
 *     tags: [Secrecy Department]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     security:
 *       - bearerAuth: []
 */
router.put('/setters/:id', secrecyOnly, secrecyController.updatePaperSetter);

// Question Papers Review
/**
 * @swagger
 * /api/secrecy/papers:
 *   get:
 *     summary: Review all submitted question papers across all subjects
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of submitted papers
 */
router.get('/papers', secrecyOnly, secrecyController.getQuestionPapers);

/**
 * @swagger
 * /api/secrecy/papers/status:
 *   post:
 *     summary: Update the internal secrecy status of a question paper
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 */
router.post('/papers/status', secrecyOnly, secrecyController.updatePaperStatus);

// Payments Management
/**
 * @swagger
 * /api/secrecy/payments:
 *   get:
 *     summary: Get all pending and processed payments for paper setters
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get('/payments', secrecyOnly, secrecyController.getPayments);

/**
 * @swagger
 * /api/secrecy/payments/process:
 *   post:
 *     summary: Process and finalize a payment to a faculty member
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 */
router.post('/payments/process', secrecyOnly, secrecyController.processPayment);

module.exports = router;
