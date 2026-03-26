const { GoogleGenerativeAI } = require("@google/generative-ai");
const Workout = require("../models/Workout");
const User = require("../models/User");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Thư viện các video YouTube CÓ THẬT 100% (Đã được verify ID)
const VERIFIED_YOUTUBE_VIDEOS = [
  { id: "W6PDh3AohAA", title: "10 min Beginner WORKOUT | Follow along - No Equipment", duration: 10, estimatedCalories: 100, difficulty: "Beginner" },
  { id: "Kg-2qfPIbPQ", title: "BEST 10 MIN Beginner Workout for Fat Burn (NO JUMPING)", duration: 10, estimatedCalories: 120, difficulty: "Beginner" },
  { id: "8TCFY4N8Uxg", title: "20 Min Dumbbell Workout That Beats Longer Sessions", duration: 20, estimatedCalories: 250, difficulty: "Intermediate" },
  { id: "qiBDUtA5kPw", title: "20-Min Dumbbell Workout For Stronger Biceps & Triceps", duration: 20, estimatedCalories: 220, difficulty: "Intermediate" },
  { id: "yqeirBfn2j4", title: "15 Min. Yoga Stretch for Stress & Anxiety Relief", duration: 15, estimatedCalories: 80, difficulty: "Beginner" },
  { id: "YAOTrvu5Lq8", title: "15 Min Daily Yoga Flow | Every Day Full Body Routine", duration: 15, estimatedCalories: 90, difficulty: "All Levels" },
  { id: "AazKfk5yT5w", title: "10 Min Beginner Workout at Home with Dumbbells", duration: 10, estimatedCalories: 130, difficulty: "Beginner" },
  { id: "pZ1Xzrh_els", title: "20-Min Dumbbell Workout for Building Stronger Back", duration: 20, estimatedCalories: 200, difficulty: "Advanced" }
];

exports.recommendWorkout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const library = await Workout.find();

    const height = user.profile?.height_cm;
    const weight = user.profile?.weight_kg;
    const goal = user.profile?.goal;

    const bmi = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : "unknown";
    const bodyType = bmi === "unknown" ? "unknown" : bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";

    const prompt = `
Bạn là HLV fitness chuyên nghiệp.

Thông tin người dùng:
- Chiều cao: ${height} cm
- Cân nặng: ${weight} kg
- BMI: ${bmi}
- Thể trạng: ${bodyType}
- Mục tiêu: ${goal}

Danh sách bài tập hệ thống:
${library.map((w) => `- ${w.title || w.name}`).join("\n")}

Danh sách video YouTube CÓ THẬT:
${JSON.stringify(VERIFIED_YOUTUBE_VIDEOS, null, 2)}

⚠️ BẮT BUỘC:
1. Lấy 3 bài TỐT NHẤT từ "Danh sách bài tập hệ thống" phù hợp với thể trạng BMI.
2. Lấy đúng 2 "id" video từ "Danh sách video YouTube CÓ THẬT" ở trên phù hợp với BMI. KHÔNG ĐƯỢC TỰ BỊA ID HAY LINK NÀO KHÁC BÊN NGOÀI DANH SÁCH NÀY.
3. Chỉ trả về JSON, không giải thích.

Định dạng JSON:
{
  "db_matches": ["Tên bài 1 từ DB", "Tên bài 2 từ DB", "Tên bài 3 từ DB"],
  "youtube_matches": ["id_youtube_1", "id_youtube_2"]
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const resultAI = await model.generateContent(prompt);
    const text = resultAI.response.text();

    const clean = text.replace(/```json|```/g, "").trim();
    let parsedData = { db_matches: [], youtube_matches: [] };

    try {
      parsedData = JSON.parse(clean);
    } catch {
      console.log("❌ JSON parse fail:", clean);
      return res.json([]);
    }

    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // 1. Map 3 bài từ DB
    const dbNames = parsedData.db_matches.map(normalize);
    const dbResults = library
      .filter((w) => dbNames.some((n) => normalize(w.title || w.name).includes(n)))
      .slice(0, 3);

    // 2. Map 2 bài Youtube TỪ DANH SÁCH VERIFIED ĐỂ CHỐNG LỖI VIDEO UNAVAILABLE
    const ytIds = parsedData.youtube_matches || [];
    const ytResults = ytIds.map((id, idx) => {
        const videoData = VERIFIED_YOUTUBE_VIDEOS.find(v => v.id === id) || VERIFIED_YOUTUBE_VIDEOS[idx % VERIFIED_YOUTUBE_VIDEOS.length];
        return {
            _id: `yt-${Date.now()}-${idx}`,
            title: videoData.title,
            name: videoData.title,
            cover_image: `https://img.youtube.com/vi/${videoData.id}/hqdefault.jpg`,
            video_url: `https://www.youtube.com/watch?v=${videoData.id}`,
            duration: videoData.duration,
            estimatedCalories: videoData.estimatedCalories,
            difficulty: videoData.difficulty,
            category: { name: "YouTube Selection" },
            description: "Bài tập chọn lọc từ YouTube dựa trên chỉ số BMI của bạn.",
            isYoutube: true
        };
    }).slice(0, 2);

    return res.json([...dbResults, ...ytResults]);
  } catch (err) {
    console.error("🔥 AI ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};