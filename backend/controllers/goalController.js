const Goal = require("../models/goalModel");
const MicroGoal = require("../models/microGoalModel");
const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Các hàm CRUD cơ bản
exports.getUserGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ user_id: req.user.id, status: "active" });
    res.json(goal);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createGoal = async (req, res) => {
  try {
    const goal = new Goal({ ...req.body, user_id: req.user.id });
    const saved = await goal.save();
    res.status(201).json(saved);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(goal);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteGoal = async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: "Goal deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// TÍCH HỢP AI GEMINI TẠO ROADMAP CÁ NHÂN HÓA
// ==========================================
exports.generateAIRoadmap = async (req, res) => {
  try {
    const { title, goal_type, duration_weeks, commitment_days_per_week, motivation, target_weight, target_health_metric, fitness_level } = req.body;
    
    if (!duration_weeks || duration_weeks < 1) return res.status(400).json({message: "Duration weeks is required."});

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const height = user.profile?.height_cm || 'Không rõ';
    const weight = user.profile?.weight_kg || 'Không rõ';
    const gender = user.profile?.gender || 'Không rõ';

    const p1End = Math.ceil(duration_weeks / 3);
    const p2End = Math.ceil((duration_weeks / 3) * 2);

    const prompt = `
Bạn là chuyên gia Thể chất & Dinh dưỡng hàng đầu thế giới. Hãy tạo một lộ trình tập luyện CỰC KỲ CÁ NHÂN HÓA.

THÔNG TIN NGƯỜI DÙNG:
- Giới tính: ${gender}, Chiều cao: ${height}cm, Cân nặng hiện tại: ${weight}kg, Trình độ: ${fitness_level}
- Mục tiêu chính: ${goal_type} (Kéo dài ${duration_weeks} tuần)
- Cân nặng hướng tới: ${target_weight}kg
- Chỉ số sức khỏe mục tiêu: ${target_health_metric}
- Cam kết: ${commitment_days_per_week} ngày/tuần.
- Lời tâm sự (Motivation): "${motivation}"

NHIỆM VỤ:
1. Chia ${duration_weeks} tuần thành 3 Giai đoạn (Phases). Tiêu đề (title) và Mô tả (desc) của mỗi Phase PHẢI NHẮC TỚI chỉ số ${target_health_metric}, cân nặng ${target_weight}kg, và dựa vào lời tâm sự "${motivation}". Đừng viết chung chung.
2. Tạo các công việc cụ thể (Micro Goals) cho TỪNG TUẦN (từ tuần 1 đến tuần ${duration_weeks}). Mỗi tuần đúng 3 công việc: 1 Dinh dưỡng (có số liệu g/kcal rõ ràng), 1 Tập luyện, 1 Thói quen. Bám sát trình độ ${fitness_level}.

⚠️ QUY TẮC BẮT BUỘC: CHỈ trả về JSON thuần túy, tuyệt đối KHÔNG bọc trong markdown \`\`\`json.
{
  "phases": [
    { "title": "[Tên Phase 1 Cụ thể]", "desc": "[Chi tiết cách đạt ${target_health_metric}...]", "startWeek": 1, "endWeek": ${p1End} },
    { "title": "[Tên Phase 2 Cụ thể]", "desc": "[Chi tiết...]", "startWeek": ${p1End + 1}, "endWeek": ${p2End} },
    { "title": "[Tên Phase 3 Cụ thể]", "desc": "[Chi tiết...]", "startWeek": ${p2End + 1}, "endWeek": ${duration_weeks} }
  ],
  "microGoals": [
    { "week": 1, "label": "Eat 150g protein to build muscle for ${target_health_metric}" },
    { "week": 1, "label": "Do ${commitment_days_per_week} workouts focusing on form" },
    ...
  ]
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const resultAI = await model.generateContent(prompt);
    const text = resultAI.response.text();
    
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    await Goal.updateMany({ user_id: req.user.id, status: "active" }, { status: "archived" });

    const newGoal = await Goal.create({
      user_id: req.user.id,
      title,
      goal_type,
      duration_weeks,
      commitment_days_per_week,
      motivation,
      target_weight,
      target_health_metric,
      fitness_level,
      phases: parsedData.phases // Lưu Roadmap cá nhân hóa từ AI
    });

    const microGoalsToInsert = parsedData.microGoals.map(mg => ({
      goal_id: newGoal._id,
      label: mg.label,
      week: mg.week,
      done: false
    }));
    await MicroGoal.insertMany(microGoalsToInsert);

    res.status(201).json({ message: "AI Generated Roadmap Successfully", goal: newGoal });

  } catch (error) {
    console.error("AI Goal Generation Error:", error);
    res.status(500).json({ message: "Failed to generate AI roadmap", error: error.message });
  }
};
exports.checkinWeekly = async (req, res) => {
  try {
    const { week, weight, feeling } = req.body;
    const goalId = req.params.id;

    if (!week || !weight) {
      return res.status(400).json({ message: "Week and Weight are required." });
    }

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    // Kiểm tra xem tuần này đã check-in chưa, nếu có thì ghi đè (update), nếu chưa thì thêm mới
    const existingIndex = goal.weekly_log.findIndex(log => log.week === Number(week));
    if (existingIndex >= 0) {
      goal.weekly_log[existingIndex].weight = Number(weight);
      goal.weekly_log[existingIndex].feeling = feeling || "normal";
      goal.weekly_log[existingIndex].date = Date.now();
    } else {
      goal.weekly_log.push({ week: Number(week), weight: Number(weight), feeling: feeling || "normal" });
    }

    await goal.save();
    res.json({ message: "Check-in successful", goal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.analyzeProgress = async (req, res) => {
  try {
    const { oldWeight, currentWeight } = req.body;
    
    const user = await User.findById(req.user.id);
    const goal = await Goal.findOne({ user_id: req.user.id, status: "active" });

    const targetWeight = goal?.target_weight || "Không xác định";
    const goalType = goal?.goal_type || "Duy trì sức khỏe";

    const prompt = `
Bạn là một PT (Huấn luyện viên cá nhân) thân thiện và chuyên nghiệp.
Học viên của bạn vừa cập nhật cân nặng.
- Cân nặng cũ: ${oldWeight} kg
- Cân nặng hiện tại: ${currentWeight} kg
- Cân nặng mục tiêu: ${targetWeight} kg
- Loại mục tiêu: ${goalType}

Hãy viết MỘT ĐOẠN VĂN NGẮN (khoảng 3-4 câu) bằng Tiếng Việt để:
1. Nhận xét sự thay đổi cân nặng này có tốt cho mục tiêu "${goalType}" của họ không.
2. Đưa ra một lời khuyên nhỏ dựa trên sự thay đổi này.
3. Cổ vũ, động viên họ.
KHÔNG dùng markdown hay định dạng phức tạp. Trả về text thuần túy.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const resultAI = await model.generateContent(prompt);
    
    res.json({ feedback: resultAI.response.text() });
  } catch (error) {
    res.status(500).json({ message: "Lỗi AI phân tích", error: error.message });
  }
};