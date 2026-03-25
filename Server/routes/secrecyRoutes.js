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

// Dashboard Stats & Activity
router.get('/stats', secrecyOnly, secrecyController.getDashboardStats);
router.get('/activity', secrecyOnly, secrecyController.getRecentActivity);

// Paper Setters Management
router.get('/setters', secrecyOnly, secrecyController.getPaperSetters);
router.post('/setters/add', secrecyOnly, secrecyController.addPaperSetter);
router.post('/setters/new', secrecyOnly, secrecyController.createNewSetter);
router.put('/setters/:id', secrecyOnly, secrecyController.updatePaperSetter);

// Question Papers Review
router.get('/papers', secrecyOnly, secrecyController.getQuestionPapers);
router.post('/papers/status', secrecyOnly, secrecyController.updatePaperStatus);

// Payments Management
router.get('/payments', secrecyOnly, secrecyController.getPayments);
router.post('/payments/process', secrecyOnly, secrecyController.processPayment);

module.exports = router;
