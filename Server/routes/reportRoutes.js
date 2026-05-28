const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth.middleware');

// Apply authentication to all report routes
router.use(verifyToken);

// --- University Admin Routes ---
router.get('/infrastructure-analytics', reportController.getInfrastructureAnalytics);
router.get('/global-exam-stats', reportController.getGlobalExamStats);
router.get('/institutional-ranking', reportController.getInstitutionalRanking);

// --- College Admin Routes ---
router.get('/faculty-grading-status', reportController.getFacultyGradingStatus);
router.get('/college-performance', reportController.getCollegePerformance);
router.get('/attendance-shortage', reportController.getAttendanceShortage);
router.get('/result-summary', reportController.getResultSummary);

module.exports = router;
