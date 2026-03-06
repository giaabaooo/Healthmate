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
  getSystemPerformance
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// Apply admin protection to all routes
router.use(protect);
router.use(requireAdmin);

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// Chart data
router.get('/chart-data', getChartData);

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
