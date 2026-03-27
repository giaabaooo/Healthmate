const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getChartData,
  getSystemLogs,
  createBackup,
  systemRecovery,
  deletePost,
  deleteGroup,
  deleteChallenge,
  getSystemPerformance
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Apply admin protection to all routes
router.use(protect);
router.use(adminOnly);

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// Chart data
router.get('/chart-data', getChartData);

router.delete('/posts/:id', protect, deletePost);
router.delete('/groups/:id', protect, deleteGroup);
router.delete('/challenges/:id', protect, deleteChallenge);

// User management CRUD
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// System logs
router.get('/logs', getSystemLogs);

// System performance
router.get('/performance', getSystemPerformance);

// Data backup
router.post('/backup', createBackup);

// System recovery
router.post('/recovery', systemRecovery);

module.exports = router;
