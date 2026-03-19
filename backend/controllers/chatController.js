const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const ChatSession = require("../models/ChatSession");
const User = require("../models/User");
const Goal = require("../models/goalModel");
const MealPlan = require("../models/MealPlan");
const WorkoutLog = require("../models/WorkoutLog");

exports.askAICoach = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Server chưa cấu hình API Key cho AI." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { userId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Tin nhắn không được để trống" });
    }

    // 1. TÌM HOẶC TẠO PHIÊN CHAT
    let session = null;
    let isValidUser = mongoose.Types.ObjectId.isValid(userId);

    if (isValidUser) {
      session = await ChatSession.findOne({ user_id: userId });
      if (!session) {
        session = new ChatSession({ user_id: userId, messages: [] });
      }
    } else {
      // Dành cho user giả lập (Mock UI)
      session = { messages: [] };
    }

    // 2. GOM THÔNG TIN USER TỪ DATABASE ĐỂ LÀM NGỮ CẢNH (CONTEXT)
    let contextText = "Chưa có nhiều thông tin chi tiết về người dùng.";
    
    if (isValidUser) {
      try {
        const user = await User.findById(userId);
        let userDetails = "";

        if (user && user.profile) {
          const p = user.profile;
          userDetails += `- Tên: ${p.full_name}, Giới tính: ${p.gender === 'male' ? 'Nam' : p.gender === 'female' ? 'Nữ' : 'Khác'}, Chiều cao: ${p.height_cm || '?'}cm, Cân nặng: ${p.weight_kg || '?'}kg. Mục tiêu tổng quát: ${p.goal === 'muscle_gain' ? 'Tăng cơ' : p.goal === 'fat_loss' ? 'Giảm mỡ' : 'Duy trì'}.\n`;
        }

        // Lấy mục tiêu chi tiết đang Active
        const activeGoal = await Goal.findOne({ user_id: userId, status: 'active' });
        if (activeGoal) {
          userDetails += `- Mục tiêu hiện tại: ${activeGoal.title} (Loại: ${activeGoal.goal_type}, Thời lượng: ${activeGoal.duration_weeks} tuần).\n`;
        }

        // Lấy thực đơn ăn uống ngày hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mealPlan = await MealPlan.findOne({ user_id: userId, date: { $gte: today } });
        if (mealPlan && mealPlan.items.length > 0) {
          userDetails += `- Kế hoạch ăn uống hôm nay: Nạp tổng cộng ${mealPlan.total_calories} kcal. Các món: ${mealPlan.items.map(i => i.name).join(', ')}.\n`;
        } else {
          userDetails += `- Hôm nay chưa lên thực đơn ăn uống.\n`;
        }

        // Lấy lịch sử tập luyện ngày hôm nay
        const workouts = await WorkoutLog.find({ user_id: userId, date: { $gte: today } });
        if (workouts.length > 0) {
          const totalTime = workouts.reduce((sum, w) => sum + w.duration_minutes, 0);
          const totalCalBurned = workouts.reduce((sum, w) => sum + w.calories_burned, 0);
          userDetails += `- Tập luyện hôm nay: Đã tập ${workouts.length} bài, tổng thời gian ${totalTime} phút, đốt cháy ${totalCalBurned} kcal.\n`;
        } else {
          userDetails += `- Hôm nay chưa có ghi nhận tập luyện nào.\n`;
        }

        contextText = userDetails;
      } catch (err) {
        console.error("Lỗi khi gom dữ liệu User Context:", err);
      }
    }

    // 3. LƯU CÂU HỎI VÀO LỊCH SỬ CHAT
    session.messages.push({ sender: "user", message: message });

    // Lấy 5 tin nhắn gần nhất để AI hiểu ngữ cảnh đang nói chuyện
    const recentHistory = session.messages.slice(-6, -1)
      .map(m => `${m.sender === 'user' ? 'Người dùng' : 'HealthMate'}: ${m.message}`)
      .join('\n');

    // 4. THIẾT LẬP PROMPT CHO GEMINI
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const systemPrompt = `
      Bạn là HealthMate, một AI Coach chuyên gia về sức khỏe, dinh dưỡng và thể hình.
      Hãy xưng hô lịch sự, thân thiện và mang tính động viên.

      DƯỚI ĐÂY LÀ HỒ SƠ VÀ TIẾN ĐỘ THỰC TẾ CỦA NGƯỜI DÙNG BẠN ĐANG TƯ VẤN:
      ${contextText}

      LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY:
      ${recentHistory}

      NHIỆM VỤ:
      Dựa vào các chỉ số hồ sơ, bữa ăn và bài tập ở trên, hãy trả lời câu hỏi dưới đây của người dùng một cách cá nhân hóa nhất, phân tích dựa trên dữ liệu thực tế của họ (ví dụ: nếu họ muốn giảm cân mà ăn lố kcal thì nhắc nhở, hoặc tính toán BMI giúp họ). Trả lời ngắn gọn, xuống dòng rõ ràng, dễ đọc.

      Câu hỏi của người dùng: "${message}"
    `;

    // 5. GỌI AI
    const result = await model.generateContent(systemPrompt);
    const aiResponse = result.response.text();

    // 6. LƯU CÂU TRẢ LỜI CỦA AI VÀO DB VÀ TRẢ VỀ FRONTEND
    session.messages.push({ sender: "ai", message: aiResponse });
    
    if (isValidUser && typeof session.save === 'function') {
      await session.save(); // Chỉ lưu nếu là user thật (có trong MongoDB)
    }

    res.status(200).json({ reply: aiResponse });
  } catch (error) {
    console.error("Lỗi AI Integration:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi gọi AI Coach" });
  }
};