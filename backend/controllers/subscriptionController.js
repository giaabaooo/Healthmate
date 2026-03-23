const User = require('../models/User');

exports.upgradeToPro = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Cập nhật lên gói Pro, hạn sử dụng 30 ngày từ thời điểm đăng ký
    user.subscription = {
      plan: 'pro',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // + 30 ngày
    };

    await user.save();

    res.json({ 
        message: "Nâng cấp Pro thành công!", 
        user: {
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            subscription: user.subscription
        }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// THÊM HÀM NÀY: Hủy gói Pro về gói Free
exports.downgradeToFree = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
  
      // Đưa về gói Free và xóa ngày hết hạn
      user.subscription = {
        plan: 'free',
        endDate: null
      };
  
      await user.save();
  
      res.json({ 
          message: "Đã trở về gói Free!", 
          user: {
              _id: user._id,
              email: user.email,
              role: user.role,
              profile: user.profile,
              subscription: user.subscription
          }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };