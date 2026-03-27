const User = require('../models/User');
const PayOS = require('@payos/node');

// Khởi tạo PayOS
const payos = new PayOS(
  '15d8eadb-4b7c-447e-8885-0dbbb5a164b7',
  'b2b607ff-1de0-415f-9bd1-d68da4d5c36c',
  'd35f4ba82dde7d6af2c2fff0cadae640f904efa76bd658f67bf023a94e2b0425'
);

exports.createPaymentLink = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const orderCode = Number(String(Date.now()).slice(-6));
    
    // GẮN CỨNG LINK LOCAL CHO FRONTEND ĐỂ TEST Ở MÁY
    const domain = 'http://localhost:5173';

    const requestData = {
      orderCode: orderCode,
      amount: 59000,
      description: "Nang cap Pro",
      returnUrl: `${domain}/subscription?status=success`,
      cancelUrl: `${domain}/subscription?cancel=true`
    };

    const paymentLink = await payos.createPaymentLink(requestData);
    res.json({ checkoutUrl: paymentLink.checkoutUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upgradeToPro = async (req, res) => {
  try {
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // + 30 ngày
    
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { "subscription.plan": "pro", "subscription.endDate": endDate } },
        { new: true, strict: false }
    );

    if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.json({ 
        message: "Nâng cấp Pro thành công!", 
        user: {
            _id: updatedUser._id,
            email: updatedUser.email,
            role: updatedUser.role,
            profile: updatedUser.profile,
            subscription: { plan: 'pro', endDate: endDate }
        }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downgradeToFree = async (req, res) => {
    try {
      const updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { $set: { "subscription.plan": "free", "subscription.endDate": null } },
          { new: true, strict: false }
      );
      
      if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy người dùng" });
  
      res.json({ 
          message: "Đã hủy gói Pro", 
          user: {
              _id: updatedUser._id,
              email: updatedUser.email,
              role: updatedUser.role,
              profile: updatedUser.profile,
              subscription: { plan: 'free', endDate: null }
          }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};