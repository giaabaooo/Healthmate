const User = require('../models/User');
const PayOS = require('@payos/node');

// Khởi tạo PayOS (Cú pháp chuẩn cho bản v1.0.10)
const payos = new PayOS(
  '15d8eadb-4b7c-447e-8885-0dbbb5a164b7',
  'b2b607ff-1de0-415f-9bd1-d68da4d5c36c',
  'd35f4ba82dde7d6af2c2fff0cadae640f904efa76bd658f67bf023a94e2b0425'
);

// [POST] /api/subscriptions/create-payment-link
exports.createPaymentLink = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Tạo mã đơn hàng duy nhất (Phải là số nguyên, tối đa 10 chữ số)
    const orderCode = Number(String(Date.now()).slice(-6));

    // LẤY TỰ ĐỘNG ĐỊA CHỈ FRONTEND (Tránh lỗi sai cổng 3000 hay 5173)
    const domain = req.headers.origin || 'http://localhost:3000';

    const requestData = {
      orderCode: orderCode,
      amount: 59000, // Giá gói Pro (59.000 VNĐ)
      description: `HM PRO ${orderCode}`, // Giới hạn mô tả 25 ký tự
      
      // PayOS sẽ trả về đúng domain hiện tại của Frontend
      returnUrl: `${domain}/subscription?status=success`, 
      cancelUrl: `${domain}/subscription?status=cancel`   
    };

    const paymentLink = await payos.createPaymentLink(requestData);
    
    // Trả về đường link để Frontend redirect người dùng sang trang thanh toán của PayOS
    res.json({ checkoutUrl: paymentLink.checkoutUrl });
  } catch (error) {
    console.error("Lỗi tạo link thanh toán:", error);
    res.status(500).json({ message: "Không thể tạo link thanh toán PayOS." });
  }
};

// [POST] Nâng cấp lên gói Pro (Chạy sau khi PayOS trả về trạng thái success)
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

// [POST] Hủy gói Pro về gói Free
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