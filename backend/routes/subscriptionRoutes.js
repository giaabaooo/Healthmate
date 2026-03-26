const express = require('express');
const router = express.Router();
// Đã import thêm createPaymentLink ở đây
const { upgradeToPro, downgradeToFree, createPaymentLink } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/upgrade', protect, upgradeToPro);
router.post('/downgrade', protect, downgradeToFree); 
// Đăng ký route mới cho PayOS
router.post('/create-payment-link', protect, createPaymentLink); 

module.exports = router;