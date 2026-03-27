import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useNavigate } from 'react-router-dom';

const AiCoachPage = () => {
  const navigate = useNavigate();

  // --- KIỂM TRA QUYỀN PRO THEO THỜI GIAN THỰC ---
  const [isProValid, setIsProValid] = useState(false);

  const checkProStatus = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.subscription?.plan === 'pro') {
        const end = new Date(u.subscription.endDate);
        setIsProValid(end >= new Date());
      } else {
        setIsProValid(false);
      }
    }
  };

  useEffect(() => {
    checkProStatus();
    window.addEventListener('user-updated', checkProStatus);
    return () => window.removeEventListener('user-updated', checkProStatus);
  }, []);

  // --- STATE CHO CHATBOT ---
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I've analyzed your biological data and recent workouts. How can I help you optimize your training today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // --- STATE CHO CHỈ SỐ SỨC KHỎE (Lấy từ API) ---
  const [metrics, setMetrics] = useState({
    metabolicRate: 0,
    recoveryScore: 0,
    sleep: "0h 0m",
    injuryRisk: "Low",
    chartData: [
      { day: 'MON', heightPercent: 5 }, { day: 'TUE', heightPercent: 5 },
      { day: 'WED', heightPercent: 5 }, { day: 'THU', heightPercent: 5 },
      { day: 'FRI', heightPercent: 5 }, { day: 'SAT', heightPercent: 5 },
      { day: 'SUN', heightPercent: 5 }
    ]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- FETCH DỮ LIỆU THẬT 100% TỪ BACKEND ---
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch('https://healthmate-y9vt.onrender.com/api/users/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Đảm bảo dữ liệu không bị undefined
          if(data && data.chartData) {
              setMetrics(data);
          }
        }
      } catch (error) {
        console.error("Lỗi tải metrics từ Backend:", error);
      }
    };

    fetchMetrics();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    setMessages(prev => [...prev, { sender: 'user', text: currentInput }]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;

      const response = await fetch('https://healthmate-y9vt.onrender.com/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            userId: user?._id || 'unknown',
            message: currentInput 
        }) 
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: "Lỗi: " + data.error }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Hệ thống AI đang quá tải hoặc mất mạng, thử lại sau nhé." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Layout>
      {/* Xóa class ép cứng chiều cao h-[calc...], thêm min-h-screen và pb-10 để page scroll tự do */}
      <div className="relative min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-12">
        
        <div className="p-6 md:p-10 grid grid-cols-12 gap-8 relative z-10 max-w-[1400px] mx-auto w-full">
          
          {/* HEADER */}
          <header className="col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Health Analytics <span className="text-primary">& AI Coach</span></h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Deep biological insights powered by HealthMate AI</p>
            </div>
            <div className="flex gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Live Sync Active</span>
              </div>
              <button className="px-6 py-2.5 bg-primary text-slate-900 font-bold rounded-xl shadow-sm hover:brightness-105 transition-all">
                Export Report
              </button>
            </div>
          </header>

          {/* RENDER NỘI DUNG HOẶC MÀN HÌNH KHÓA */}
          {!isProValid ? (
            <div className="col-span-12 flex items-center justify-center py-32">
              <div className="bg-[#111827] border border-slate-700 p-10 rounded-3xl max-w-md text-center shadow-2xl">
                 <span className="material-symbols-outlined text-6xl text-primary mb-4">smart_toy</span>
                 <h2 className="text-2xl font-black text-white mb-3">AI Coach Độc Quyền</h2>
                 <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Trò chuyện 24/7 với chuyên gia AI cần tài khoản Pro. Nâng cấp để mở khóa phân tích sức khỏe nâng cao.
                 </p>
                 <button onClick={() => navigate('/subscription')} className="w-full py-3.5 bg-primary text-slate-900 font-bold rounded-xl shadow-lg hover:brightness-110 transition-all">
                    Nâng cấp Pro Ngay
                 </button>
              </div>
            </div>
          ) : (
            <>
              {/* CỘT TRÁI: Dữ liệu Sức Khỏe */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                
                {/* Metrics 3 cột */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">Metabolic Rate</span>
                      <span className="material-symbols-outlined text-primary">speed</span>
                    </div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {metrics.metabolicRate.toLocaleString()} <span className="text-base font-bold text-slate-400 ml-1">kcal</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">Recovery Score</span>
                      <span className="material-symbols-outlined text-primary">battery_charging_full</span>
                    </div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {metrics.recoveryScore}<span className="text-base font-bold text-slate-400 ml-1">%</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">Sleep Quality</span>
                      <span className="material-symbols-outlined text-primary">nights_stay</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{metrics.sleep}</div>
                  </div>
                </div>

                {/* Biểu đồ Impact */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workout Impact Analysis (7 Days)</h2>
                  </div>
                  <div className="h-64 relative flex items-end justify-between gap-3 px-2">
                    {metrics.chartData.map((data, idx) => (
                      <div key={idx} className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-xl relative group overflow-hidden transition-all cursor-pointer" style={{ height: `${data.heightPercent}%` }}>
                        <div className="absolute bottom-0 w-full bg-primary transition-all h-full origin-bottom scale-y-0 group-hover:scale-y-100"></div>
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-2 w-full text-center text-[10px] font-bold text-slate-900">{data.heightPercent > 5 ? 'Active' : ''}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-5 text-xs text-slate-400 font-bold px-2">
                    {metrics.chartData.map((data, idx) => (
                      <span key={idx} className="w-full text-center">{data.day}</span>
                    ))}
                  </div>
                </div>

                {/* Phân tích AI bên dưới */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Injury Risk */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold mb-8 text-slate-900 dark:text-white text-lg">Injury Risk Assessment</h3>
                    <div className="relative flex flex-col items-center">
                      <div className="w-48 h-24 overflow-hidden relative">
                        <div className="absolute top-0 w-48 h-48 rounded-full border-[16px] border-slate-100 dark:border-slate-800"></div>
                        <div className={`absolute top-0 w-48 h-48 rounded-full border-[16px] border-transparent border-l-primary border-t-primary transition-transform duration-1000 ${metrics.injuryRisk === 'Low' ? 'rotate-[15deg]' : metrics.injuryRisk === 'Medium' ? 'rotate-[90deg] border-l-amber-500 border-t-amber-500' : 'rotate-[165deg] border-l-red-500 border-t-red-500'}`}></div>
                      </div>
                      <div className="absolute top-16 text-center">
                        <span className={`text-3xl font-black ${metrics.injuryRisk === 'High' ? 'text-red-500' : metrics.injuryRisk === 'Medium' ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                          {metrics.injuryRisk}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Current Risk Level</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Insight Highlight */}
                  <div className="bg-[#eefcf3] dark:bg-primary/10 p-8 rounded-3xl border border-[#bbf0ce] dark:border-primary/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-8xl text-primary">auto_awesome</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">psychology</span>
                        <h3 className="font-black text-primary text-lg">AI Performance Insight</h3>
                        </div>
                        <ul className="space-y-4 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        <li className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-base text-primary mt-0.5">check_circle</span>
                            <span>Based on your {metrics.metabolicRate} kcal burn rate, ensure adequate protein intake today.</span>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-base text-primary mt-0.5">check_circle</span>
                            <span>Recovery is at {metrics.recoveryScore}%. {Number(metrics.recoveryScore) > 70 ? 'Your body is fully ready for high intensity training.' : 'Consider active recovery or a rest day to prevent overtraining.'}</span>
                        </li>
                        </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: Chatbot (Sticky để trượt theo khi scroll) */}
              <div className="col-span-12 lg:col-span-4 h-full relative">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col sticky top-[100px] h-[600px] lg:h-[calc(100vh-140px)] overflow-hidden">
                  
                  {/* Khung Header Chat */}
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4 shrink-0">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-slate-900 text-[22px]">smart_toy</span>
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                    </div>
                    <div>
                      <h3 className="font-black leading-tight text-slate-900 dark:text-white">Coach HealthMate</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">AI Personal Health Strategist</p>
                    </div>
                  </div>

                  {/* Vùng Tin Nhắn */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.sender === 'ai' ? (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px] text-slate-600 dark:text-slate-300">person</span>
                          </div>
                        )}

                        <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-primary text-slate-900 rounded-tr-sm font-bold' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm font-medium leading-relaxed'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-500 flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Chat */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
                      <button onClick={() => setInput("Adjust my macros for today")} className="whitespace-nowrap px-3 py-1.5 bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-[11px] font-bold rounded-full text-slate-600 hover:text-primary transition-colors shadow-sm">Adjust macros</button>
                      <button onClick={() => setInput("Show my current progress")} className="whitespace-nowrap px-3 py-1.5 bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-[11px] font-bold rounded-full text-slate-600 hover:text-primary transition-colors shadow-sm">Show my progress</button>
                    </div>
                    
                    <div className="relative flex gap-2">
                      <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm font-medium text-slate-900 dark:text-white focus:border-primary outline-none transition-all" 
                        placeholder="Ask anything about your health..." 
                        disabled={isTyping}
                      />
                      <button onClick={handleSendMessage} disabled={isTyping || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary text-slate-900 rounded-lg flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AiCoachPage;