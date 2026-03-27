const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getUsers, createUser, updateUser, deleteUser,
  getChartData, getSystemLogs, createBackup, systemRecovery,
  deletePost, deleteGroup, deleteChallenge, getSystemPerformance
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/chart-data', getChartData);

// CÁC ĐƯỜNG DẪN XÓA CHO ADMIN
router.delete('/posts/:id', deletePost);
router.delete('/groups/:id', deleteGroup);
router.delete('/challenges/:id', deleteChallenge);

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/logs', getSystemLogs);
router.get('/performance', getSystemPerformance);
router.post('/backup', createBackup);
router.post('/recovery', systemRecovery);

module.exports = router;