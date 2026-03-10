import { useState } from 'react';
import Layout from '../components/Layout'; // Giả sử bạn đã có Layout bọc Navbar/Footer

const AiCoachPage = () => {
  // State quản lý tin nhắn
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I've analyzed your sleep data and morning heart rate variability. You're primed for a heavy training session today. Shall we focus on your deadlift progression or a new metabolic circuit?"
    },
    {
      sender: 'user',
      text: "Let's do the deadlift progression. My lower back feels a bit tight though, is that a concern?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Hàm xử lý gửi tin nhắn
 const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 1. Hiển thị tin nhắn user ngay lập tức
    const currentInput = input;
    setMessages(prev => [...prev, { sender: 'user', text: currentInput }]);
    setInput('');
    setIsTyping(true); // Hiển thị hiệu ứng "Coach is typing..."

    try {
      const token = localStorage.getItem('token'); // Lấy token ra
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;

      const response = await fetch('http://localhost:8000/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <--- GẮN TOKEN VÀO ĐÂY
        },
        body: JSON.stringify({ 
            userId: user?._id || 'ID_GIA_LAP', // Truyền ID thật của User
            message: currentInput 
        }) 
      });

      const data = await response.json();

      if (response.ok) {
        // 3. Cập nhật câu trả lời của AI vào UI
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: "Lỗi: " + data.error }]);
      }

    } catch (error) {
      console.error("Lỗi khi chat với AI:", error);
      setMessages(prev => [...prev, { sender: 'ai', text: "Hệ thống AI đang quá tải, thử lại sau nhé." }]);
    } finally {
      // 4. Tắt hiệu ứng typing
      setIsTyping(false);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
        
        {/* --- CỘT TRÁI (Phân tích chỉ số) --- */}
        <div className="col-span-12 lg:col-span-8 space-y-6 overflow-y-auto pr-2">
           {/* Copy nguyên phần "Left Column: Health Metrics" của bạn vào đây */}
           <h1 className="text-3xl font-bold">Health Analytics <span className="text-primary">& AI Coach</span></h1>
           {/* ... Các thẻ thống kê ... */}
        </div>

        {/* --- CỘT PHẢI (Khung Chat AI) --- */}
        <div className="col-span-12 lg:col-span-4 h-full">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-full overflow-hidden">
            
            {/* Header Chat */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="material-icons text-slate-900">smart_toy</span>
              </div>
              <div>
                <h3 className="font-bold">Coach HealthMate</h3>
                <p className="text-xs text-slate-500">AI Personal Health Strategist</p>
              </div>
            </div>

            {/* Vùng hiển thị tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.sender === 'ai' ? (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-icons text-sm text-primary">smart_toy</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-slate-300 rounded-full shrink-0"></div> // Thay bằng ảnh user
                  )}
                  <div className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.sender === 'user' ? 'bg-primary text-slate-900 rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="text-xs text-slate-400 italic">Coach is typing...</div>
              )}
            </div>

            {/* Ô nhập tin nhắn */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="relative">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="Ask anything..." 
                  type="text"
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-slate-900 rounded-lg flex items-center justify-center"
                >
                  <span className="material-icons text-sm">send</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default AiCoachPage;