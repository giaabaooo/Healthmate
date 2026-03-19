const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const WorkoutLog = require('../models/WorkoutLog');

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
const getHealthMetrics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const p = user.profile || {};
    const weight = p.weight_kg || 70;
    const height = p.height_cm || 170;
    const gender = p.gender || 'male';
    const age = 25; // Tạm giả định 25 tuổi nếu không có ngày sinh

    // 1. Tính BMR (Basal Metabolic Rate) bằng công thức Mifflin-St Jeor
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === 'female' ? bmr - 161 : bmr + 5;

    // 2. Tính Calo tập luyện hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWorkouts = await WorkoutLog.find({ user_id: user._id, date: { $gte: today } });
    const todayActiveCal = todayWorkouts.reduce((sum, w) => sum + w.calories_burned, 0);

    // Metabolic Rate = BMR cơ bản + Calo vận động
    const metabolicRate = Math.round(bmr + todayActiveCal);

    // 3. Lấy dữ liệu 7 ngày qua cho biểu đồ Workout Impact
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);

    const pastWorkouts = await WorkoutLog.find({
      user_id: user._id,
      date: { $gte: sevenDaysAgo }
    });

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const chartData = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = days[d.getDay()];
      
      // Tính tổng phút tập của ngày hôm đó
      const minsThatDay = pastWorkouts
        .filter(w => new Date(w.date).toDateString() === d.toDateString())
        .reduce((sum, w) => sum + w.duration_minutes, 0);
        
      chartData.push({
        day: dayLabel,
        minutes: minsThatDay,
        // Chuyển số phút thành phần trăm chiều cao cột (Giả sử 120 phút là 100% cột)
        heightPercent: Math.min((minsThatDay / 120) * 100, 100) || 5 // mặc định 5% cho có vạch nhỏ
      });
    }

    // 4. Giả lập Recovery & Sleep (Sau này có thể tạo bảng SleepLog để lưu số liệu thật)
    // Nếu hôm nay tập nhiều -> Điểm phục hồi giảm
    const recoveryScore = Math.max(100 - (todayActiveCal / 20), 40).toFixed(0); 
    const sleepHours = 7;
    const sleepMins = 45 - (todayWorkouts.length * 5); // Random logic cho vui
    
    // Đánh giá nguy cơ chấn thương
    const injuryRisk = parseInt(recoveryScore) < 60 ? 'High' : parseInt(recoveryScore) < 80 ? 'Medium' : 'Low';

    res.json({
      metabolicRate,
      recoveryScore,
      sleep: `${sleepHours}h ${sleepMins}m`,
      chartData,
      injuryRisk
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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
  getHealthMetrics,
};
