const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Hàm tiện ích để tạo JWT cho user
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Thiếu cấu hình JWT_SECRET trong .env");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// [POST] Đăng ký người dùng mới
const registerUser = async (req, res) => {
  try {
    const { email, password, profile } = req.body;

    if (!email || !password || !profile?.full_name) {
      return res.status(400).json({
        message: "Email, mật khẩu và họ tên là bắt buộc.",
      });
    }

    // 1. Kiểm tra xem email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    // 2. Mã hóa mật khẩu (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Tạo user mới và lưu vào DB
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      profile, // Chứa full_name, gender, height_cm... từ form gửi lên
    });

    // 4. Tạo token đăng nhập luôn sau khi đăng ký
    const token = generateToken(user._id);

    // 5. Trả về kết quả (Không trả về password_hash)
    res.status(201).json({
      message: "Đăng ký tài khoản thành công!",
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// [POST] Đăng nhập
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ email và mật khẩu." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng." });
    }

    if (user.status === "banned") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng." });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// [GET] Thông tin user hiện tại (hồ sơ cá nhân)
// Yêu cầu: đã qua middleware bảo vệ (req.user đã tồn tại)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


const updateDailyRoutine = async (req, res) => {
  try {
    const { date, exercises } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = user.daily_routine.find((d) => d.date === date);

    if (existing) {
      existing.exercises = exercises;
    } else {
      user.daily_routine.push({ date, exercises });
    }

    await user.save();

    res.json({ message: "Daily routine updated" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// [PUT] Cập nhật daily routine
const getDailyRoutine = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = {};

    if (user.daily_routine && user.daily_routine.length > 0) {
      user.daily_routine.forEach((day) => {
        result[day.date] = day.exercises;
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// [PUT] Cập nhật hồ sơ cá nhân
// Body dự kiến: { profile: { full_name, gender, height_cm, weight_kg, goal } }
const updateProfile = async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile) {
      return res
        .status(400)
        .json({ message: "Thiếu dữ liệu profile để cập nhật." });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // Gộp profile cũ và mới (cho phép cập nhật từng phần)
    user.profile = {
      ...user.profile,
      ...profile,
    };

    const updatedUser = await user.save();

    res.json({
      message: "Cập nhật hồ sơ thành công!",
      profile: updatedUser.profile,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
const googleLogin = async (req, res) => {
  try {
    const { email, full_name, sub } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Không lấy được email từ Google." });
    }

    // Kiểm tra user đã tồn tại chưa
    let user = await User.findOne({ email });

    if (!user) {
      // Mã hóa một mật khẩu ngẫu nhiên cho user Google vì Schema bắt buộc có password_hash
      const salt = await bcrypt.genSalt(10);
      const randomPassword = await bcrypt.hash(
        sub || Math.random().toString(),
        salt,
      );

      user = await User.create({
        email,
        password_hash: randomPassword,
        profile: {
          full_name: full_name || "Người dùng Google",
        },
      });
    } else if (user.status === "banned") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa." });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Đăng nhập Google thành công!",
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// [GET] Danh sách customers (admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("_id email profile.full_name")
      .sort({ "profile.full_name": 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getUsers,
  googleLogin,
  getDailyRoutine,
  updateDailyRoutine,
};
