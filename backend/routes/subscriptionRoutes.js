const express = require('express');
const router = express.Router();
const { upgradeToPro, downgradeToFree } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/upgrade', protect, upgradeToPro);
router.post('/downgrade', protect, downgradeToFree); // Thêm dòng này

module.exports = router;