const express = require('express');
const router = express.Router();
const secrecyController = require('../controllers/secrecyController');
const { verifyToken } = require('../middleware/auth.middleware');

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacherId: { type: integer }
 *               subjectIds: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Teacher authorized successfully
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               subjectIds: { type: array, items: { type: integer } }
 *     responses:
 *       201:
 *         description: New setter created and authorized
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
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subjectIds: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Setter updated successfully
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paperId: { type: integer }
 *               status: { type: string }
 *               comments: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId: { type: integer }
 *               amount: { type: number }
 *               transactionDetails: { type: string }
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post('/payments/process', secrecyOnly, secrecyController.processPayment);

// -- POST-EXAM SECRECY ROUTES --
/**
 * @swagger
 * /api/secrecy/exam-subjects:
 *   get:
 *     summary: Get exams for secrecy coding
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 */
router.get('/exam-subjects', secrecyOnly, secrecyController.getExamSubjectsForCoding);

/**
 * @swagger
 * /api/secrecy/encode-sheets:
 *   post:
 *     summary: Encode answer sheets
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 */
router.post('/encode-sheets', secrecyOnly, secrecyController.encodeAnswerSheets);

/**
 * @swagger
 * /api/secrecy/secrecy-codes:
 *   get:
 *     summary: Get secrecy codes mapping
 *     tags: [Secrecy Department]
 *     security:
 *       - bearerAuth: []
 */
router.get('/secrecy-codes', secrecyOnly, secrecyController.getSecrecyCodes);

module.exports = router;
