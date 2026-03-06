const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware bảo vệ route: yêu cầu người dùng gửi kèm JWT hợp lệ
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!process.env.JWT_SECRET) {
        return res
          .status(500)
          .json({ message: 'Thiếu cấu hình JWT_SECRET trong server.' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy role từ DB để enforce authorization
      const user = await User.findById(decoded.id).select('role');
      if (!user) {
        return res.status(401).json({ message: 'User không tồn tại.' });
      }

      // Lưu id và role vào req để controller sử dụng
      req.user = { id: decoded.id, role: user.role };

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối.' });
  }
};

// Middleware chỉ cho phép admin: phải dùng sau protect
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập.' });
  }
  next();
};

module.exports = {
  protect,
  adminOnly
};
