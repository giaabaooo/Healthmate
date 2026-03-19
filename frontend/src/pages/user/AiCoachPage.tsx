import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';

const AiCoachPage = () => {
  // --- STATE CHO CHATBOT ---
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I've analyzed your sleep data and recent workouts. How can I help you optimize your training today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // --- STATE CHO CHỈ SỐ SỨC KHỎE ---
  const [metrics, setMetrics] = useState({
    metabolicRate: 0,
    recoveryScore: 0,
    sleep: "0h 0m",
    injuryRisk: "Low",
    chartData: [
      { day: 'MON', heightPercent: 10 }, { day: 'TUE', heightPercent: 10 },
      { day: 'WED', heightPercent: 10 }, { day: 'THU', heightPercent: 10 },
      { day: 'FRI', heightPercent: 10 }, { day: 'SAT', heightPercent: 10 },
      { day: 'SUN', heightPercent: 10 }
    ]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // FETCH DỮ LIỆU SỨC KHỎE TỪ BACKEND
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const isGoogle = localStorage.getItem('isGoogleLogin');
        
        // Nếu là tài khoản Google Mock thì tạo data ảo
        if (isGoogle === 'true') {
           setMetrics({
              metabolicRate: 2350,
              recoveryScore: 82,
              sleep: "7h 15m",
              injuryRisk: "Low",
              chartData: [
                { day: 'MON', heightPercent: 40 }, { day: 'TUE', heightPercent: 80 },
                { day: 'WED', heightPercent: 30 }, { day: 'THU', heightPercent: 90 },
                { day: 'FRI', heightPercent: 60 }, { day: 'SAT', heightPercent: 100 },
                { day: 'SUN', heightPercent: 20 }
              ]
           });
           return;
        }

        // Nếu là tài khoản thật, gọi API
        const response = await fetch('http://localhost:8000/api/users/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Lỗi tải metrics:", error);
      }
    };

    fetchMetrics();
  }, []);

  // HÀM GỬI TIN NHẮN CHO AI
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

      const response = await fetch('http://localhost:8000/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            userId: user?._id || 'ID_GIA_LAP',
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
      setMessages(prev => [...prev, { sender: 'ai', text: "Hệ thống AI đang quá tải, thử lại sau nhé." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Layout>
      <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-primary/10 blur-[100px] -z-10 pointer-events-none"></div>

      <div className="p-4 md:p-8 grid grid-cols-12 gap-6 relative z-10 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Health Analytics <span className="text-primary">& AI Coach</span></h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Deep biological insights powered by HealthMate AI</p>
          </div>
          <div className="flex gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">Live Biometrics Syncing</span>
            </div>
            <button className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">
              Export Report
            </button>
          </div>
        </header>

        {/* Left Column: Health Metrics & Body Impact */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Key Metrics Grid - DỮ LIỆU ĐỘNG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Metabolic Rate</span>
                <span className="material-icons text-primary">speed</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {metrics.metabolicRate.toLocaleString()} <span className="text-sm font-normal text-slate-400">kcal</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Recovery Score</span>
                <span className="material-icons text-primary">battery_charging_full</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {metrics.recoveryScore}<span className="text-sm font-normal text-slate-400">%</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Sleep Quality</span>
                <span className="material-icons text-primary">nights_stay</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.sleep}</div>
            </div>
          </div>

          {/* Body Impact Visualization - BIỂU ĐỒ ĐỘNG */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workout Impact Analysis (7 Days)</h2>
            </div>
            <div className="h-64 relative flex items-end justify-between gap-2 px-4">
              {metrics.chartData.map((data, idx) => (
                <div key={idx} className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative group overflow-hidden" style={{ height: `${data.heightPercent}%` }}>
                  <div className="absolute bottom-0 w-full bg-primary/40 group-hover:bg-primary transition-all h-full"></div>
                  {/* Tooltip hiện số phút tập */}
                  <div className="absolute opacity-0 group-hover:opacity-100 bottom-2 w-full text-center text-[10px] font-bold text-slate-900">{data.heightPercent > 5 ? 'Active' : ''}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium px-4">
              {metrics.chartData.map((data, idx) => (
                <span key={idx} className="w-full text-center">{data.day}</span>
              ))}
            </div>
          </div>

          {/* Injury Risk - ĐỘNG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Injury Risk Assessment</h3>
              <div className="relative flex flex-col items-center">
                <div className="w-48 h-24 overflow-hidden relative">
                  <div className="absolute top-0 w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-slate-800"></div>
                  <div className={`absolute top-0 w-48 h-48 rounded-full border-[12px] border-transparent border-l-primary border-t-primary transition-transform duration-1000 ${metrics.injuryRisk === 'Low' ? 'rotate-[15deg]' : metrics.injuryRisk === 'Medium' ? 'rotate-[90deg] border-l-amber-500 border-t-amber-500' : 'rotate-[165deg] border-l-red-500 border-t-red-500'}`}></div>
                </div>
                <div className="absolute top-16 text-center">
                  <span className={`text-2xl font-bold ${metrics.injuryRisk === 'High' ? 'text-red-500' : metrics.injuryRisk === 'Medium' ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                    {metrics.injuryRisk}
                  </span>
                  <p className="text-[10px] text-slate-400 uppercase">Current Risk Level</p>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl border border-primary/20 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-primary">auto_awesome</span>
                <h3 className="font-bold text-primary">AI Performance Insight</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-2">
                  <span className="material-icons text-xs text-primary mt-0.5">check_circle</span>
                  Based on your {metrics.metabolicRate} kcal burn rate, ensure adequate protein intake today.
                </li>
                <li className="flex gap-2">
                  <span className="material-icons text-xs text-primary mt-0.5">check_circle</span>
                  Recovery is at {metrics.recoveryScore}%. {Number(metrics.recoveryScore) > 70 ? 'Ready for high intensity.' : 'Consider active recovery or rest.'}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: AI Coach Chatbot (GIỮ NGUYÊN) --- */}
        <div className="col-span-12 lg:col-span-4 h-full">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-[600px] lg:h-[calc(100vh-140px)] sticky top-24 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4 shrink-0">
              <div className="relative">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="material-icons text-slate-900">smart_toy</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white dark:border-slate-900 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold leading-tight text-slate-900 dark:text-white">Coach HealthMate</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI Personal Health Strategist</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.sender === 'ai' ? (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-icons text-sm text-primary">smart_toy</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <span className="material-icons text-sm text-slate-600 dark:text-slate-300">person</span>
                    </div>
                  )}

                  <div className={`p-4 rounded-xl max-w-[85%] text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-slate-900 rounded-tr-none font-medium' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none leading-relaxed'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-icons text-sm text-primary">smart_toy</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl rounded-tl-none text-sm text-slate-500 flex items-center gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
                <button onClick={() => setInput("Adjust my macros for today")} className="whitespace-nowrap px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-full text-slate-500 hover:text-primary transition-colors">Adjust macros</button>
                <button onClick={() => setInput("Show my current progress")} className="whitespace-nowrap px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-full text-slate-500 hover:text-primary transition-colors">Show my progress</button>
              </div>
              
              <div className="relative flex gap-2">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  placeholder="Ask anything about your health..." 
                  disabled={isTyping}
                />
                <button onClick={handleSendMessage} disabled={isTyping || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-slate-900 rounded-lg flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
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