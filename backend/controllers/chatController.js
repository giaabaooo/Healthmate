const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatSession = require('../models/ChatSession');

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.askAICoach = async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Server chưa cấu hình API Key cho AI." });
        }
        
        // Khởi tạo AI bên trong hàm
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const { userId, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Tin nhắn không được để trống" });
        }

        // 1. Tìm hoặc tạo phiên chat mới cho user (Sửa userId thành user_id)
        let session = await ChatSession.findOne({ user_id: userId });
        if (!session) {
            session = new ChatSession({ user_id: userId, messages: [] });
        }

        // 2. Lưu câu hỏi của User vào DB (Sửa role/content thành sender/message)
        session.messages.push({ sender: 'user', message: message });

        // 3. Gọi AI
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const systemPrompt = `Bạn là HealthMate, một AI chuyên gia về sức khỏe và thể hình. Hãy trả lời ngắn gọn, chuyên nghiệp, mang tính động viên. Người dùng hỏi: ${message}`;
        
        const result = await model.generateContent(systemPrompt);
        const aiResponse = result.response.text();

        // 4. Lưu câu trả lời của AI vào DB
        session.messages.push({ sender: 'ai', message: aiResponse });
        await session.save();

        // 5. Trả về cho Frontend
        res.status(200).json({ reply: aiResponse });

    } catch (error) {
        console.error("Lỗi AI Integration:", error);
        res.status(500).json({ error: "Lỗi hệ thống khi gọi AI Coach" });
    }
};