import Layout from '../../components/Layout';
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getTodayProgress } from "../../services/progressService";
import { getUserGoal } from "../../services/goalService";
import toast, { Toaster } from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────
interface MicroGoal {
  _id: string;
  goal_id?: string;
  label: string;
  done: boolean;
  week: number;
}

interface WeeklyLog {
  week: number;
  weight: number;
  feeling: string;
  date: string;
}

interface Phase {
  title: string;
  desc: string;
  startWeek: number;
  endWeek: number;
  progress?: number; 
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const mapGoalTypeToDisplay = (type: string) => {
  switch (type) {
    case 'fat_loss': return 'Giảm mỡ / Siết cơ (Cutting)';
    case 'muscle_gain': return 'Tăng cơ / Tăng cân (Bulking)';
    case 'endurance': return 'Tăng sức bền (Endurance)';
    case 'maintain': return 'Duy trì vóc dáng';
    default: return 'Sức khỏe tổng quát';
  }
};

const calculateSuggestedGoal = (weight_kg?: number, height_cm?: number) => {
  if (!weight_kg || !height_cm) return 'muscle_gain'; 
  const height_m = height_cm / 100;
  const bmi = weight_kg / (height_m * height_m);
  
  if (bmi >= 25) return 'fat_loss'; 
  if (bmi < 18.5) return 'muscle_gain'; 
  return 'maintain'; 
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FitnessGoal = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);
  const [microGoals, setMicroGoals] = useState<MicroGoal[]>([]);
  
  // UI States
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showRoadmapDetail, setShowRoadmapDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [showCongrats, setShowCongrats] = useState(false);
  
  // Edit MicroGoal States
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskLabel, setEditTaskLabel] = useState("");

  // History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyGoals, setHistoryGoals] = useState<any[]>([]);

  // Daily Tracking & Alert
  const [dailyAlert, setDailyAlert] = useState<{isOpen: boolean, message: string, title: string, type: 'good' | 'bad' | 'neutral'}>({
    isOpen: false, message: '', title: '', type: 'neutral'
  });

  const [checkinModal, setCheckinModal] = useState({ isOpen: false, week: 1 });
  const [checkinData, setCheckinData] = useState({ weight: '', feeling: 'normal' });

  const [isProValid, setIsProValid] = useState(true); 
  const [suggestedGoalType, setSuggestedGoalType] = useState('muscle_gain');
  
  // Cân nặng đồng bộ toàn cục (lấy từ Profile mới nhất)
  const [currentGlobalWeight, setCurrentGlobalWeight] = useState<number | string>('N/A');

  const [formData, setFormData] = useState({
    title: 'Hành trình lột xác của tôi',
    goal_type: 'muscle_gain',
    duration_weeks: 12,
    commitment_days_per_week: 5,
    motivation: 'Tôi muốn thay đổi bản thân và trở nên khỏe mạnh hơn.',
    target_weight: '',
    target_health_metric: 'Tăng sức mạnh tổng thể',
    fitness_level: 'beginner'
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.subscription?.plan === 'pro') {
        const end = new Date(u.subscription.endDate);
        if (end >= new Date()) setIsProValid(true);
      } else {
        setIsProValid(false);
      }
      
      if (u.profile?.weight_kg && u.profile?.height_cm) {
          const w = u.profile.weight_kg;
          const h = u.profile.height_cm;
          
          setCurrentGlobalWeight(w); // Cập nhật cân nặng toàn cục lúc load

          const suggested = calculateSuggestedGoal(w, h);
          setSuggestedGoalType(suggested);
          
          let targetW = w;
          let targetMetric = 'Khỏe mạnh hơn mỗi ngày';
          if (suggested === 'fat_loss') { targetW = w - 5; targetMetric = 'Giảm 5cm vòng bụng'; }
          if (suggested === 'muscle_gain') { targetW = w + 5; targetMetric = 'Nâng Bench Press 50kg'; }
          
          setFormData(prev => ({ 
              ...prev, 
              goal_type: suggested,
              target_weight: targetW.toString(),
              target_health_metric: targetMetric
          }));
      }
    }
  }, []);

  const totalDurationWeeks = goal?.duration_weeks || formData.duration_weeks || 12;

  const fetchGoalData = async () => {
    setLoading(true);
    try {
      const goalData = await getUserGoal();
      if (goalData && goalData._id) {
        setGoal(goalData);
        setFormData({
          title: goalData.title || '',
          goal_type: goalData.goal_type || 'muscle_gain',
          duration_weeks: goalData.duration_weeks || 12,
          commitment_days_per_week: goalData.commitment_days_per_week || 5,
          motivation: goalData.motivation || '',
          target_weight: goalData.target_weight || '',
          target_health_metric: goalData.target_health_metric || '',
          fitness_level: goalData.fitness_level || 'beginner'
        });
        setIsEditingGoal(false);

        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/api/goals/micro/${goalData._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) {
            const micro = await res.json();
            setMicroGoals(micro || []);
        }

        triggerDailyReview(goalData);
      } else {
        setIsEditingGoal(true); 
      }
    } catch (error) { 
      setIsEditingGoal(true);
    } finally {
      setLoading(false);
    }
  };

  const triggerDailyReview = async (activeGoal: any) => {
      const today = new Date().toDateString();
      const lastAlert = localStorage.getItem('lastFitnessAlertDate');
      if (lastAlert === today) return;

      const logs = activeGoal.weekly_log || [];
      if (logs.length >= 2) {
          const latest = logs[logs.length - 1].weight;
          const prev = logs[logs.length - 2].weight;
          try {
              const token = localStorage.getItem("token");
              const res = await fetch(`http://localhost:8000/api/goals/analyze-progress`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ oldWeight: prev, currentWeight: latest })
              });
              if (res.ok) {
                  const data = await res.json();
                  setDailyAlert({ isOpen: true, title: 'Đánh giá từ AI Coach 🤖', message: data.feedback, type: 'neutral' });
                  localStorage.setItem('lastFitnessAlertDate', today);
              }
          } catch(e) {}
      } else if (logs.length === 1) {
          setDailyAlert({
              isOpen: true, title: 'Hành trình bắt đầu! 🚀',
              message: 'Tuyệt vời! Bạn đã có những check-in đầu tiên. Cứ duy trì kỉ luật mỗi ngày nhé, tôi sẽ luôn theo dõi và nhắc nhở bạn.',
              type: 'good'
          });
          localStorage.setItem('lastFitnessAlertDate', today);
      }
  };

  useEffect(() => {
    fetchGoalData();
    getTodayProgress().then(setProgress).catch(console.error);
  }, []);

  const handleGenerateAIRoadmap = async () => {
      if (!formData.title.trim()) return toast.error("Vui lòng nhập tiêu đề hành trình.");
      const duration = Number(formData.duration_weeks);
      if (duration < 1 || duration > 52) return toast.error("Thời gian phải từ 1 đến 52 tuần.");
      const days = Number(formData.commitment_days_per_week);
      if (days < 1 || days > 7) return toast.error("Số ngày tập mỗi tuần phải từ 1 đến 7 ngày.");
      const tWeight = Number(formData.target_weight);
      if (!tWeight || tWeight < 20 || tWeight > 300) return toast.error("Vui lòng nhập cân nặng mục tiêu hợp lý.");
      if (!formData.target_health_metric.trim()) return toast.error("Vui lòng nhập chỉ số sức khỏe mục tiêu.");

      const token = localStorage.getItem("token");
      if (!token) return;

      if(goal?._id) {
          if(!window.confirm("Tạo lộ trình AI mới sẽ lưu trữ hành trình hiện tại của bạn vào lịch sử. Bạn có chắc chắn?")) return;
      }

      setLoadingAI(true);
      toast.loading("AI đang phân tích hồ sơ tạo lộ trình cho bạn...", { id: 'ai' });
      try {
          const res = await fetch(`http://localhost:8000/api/goals/generate-roadmap`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(formData)
          });

          if(res.ok) {
              toast.success("Đã tạo thành công lộ trình cá nhân hóa!", { id: 'ai' });
              fetchGoalData(); 
          } else {
              const errData = await res.json();
              toast.error(errData.message || "Lỗi khi tạo AI Roadmap.", { id: 'ai' });
          }
      } catch (err) {
          toast.error("Lỗi kết nối mạng.", { id: 'ai' });
      } finally {
          setLoadingAI(false);
      }
  };

  const handleResetGoal = () => {
    if (window.confirm("Bạn muốn thiết lập mục tiêu mới? Dữ liệu cũ sẽ được lưu lại trong lịch sử.")) {
      setIsEditingGoal(true);
      setGoal(null);
      setMicroGoals([]);
    }
  };

  const handleFetchHistory = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/api/goals/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setHistoryGoals(data);
            setShowHistoryModal(true);
        } else {
            toast.error("Không thể tải lịch sử mục tiêu.");
        }
    } catch(err) {
        toast.error("Lỗi kết nối khi tải lịch sử.");
    }
  };

  const handleCompleteGoalAndReset = () => {
    setShowCongrats(false);
    setIsEditingGoal(true);
    setGoal(null);
    setMicroGoals([]);
  };

  const toggleMicroGoal = async (id: string, currentStatus: boolean) => {
    setMicroGoals(prev => prev.map(g => g._id === id ? { ...g, done: !currentStatus } : g));
    try {
        const token = localStorage.getItem("token");
        await fetch(`http://localhost:8000/api/goals/micro/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ done: !currentStatus }) 
        });
    } catch(err) {
        setMicroGoals(prev => prev.map(g => g._id === id ? { ...g, done: currentStatus } : g));
        toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const saveEditTask = async (id: string) => {
    if (!editTaskLabel.trim()) return toast.error("Nội dung không được để trống");
    
    const currentTask = microGoals.find(g => g._id === id);
    const previousLabel = currentTask?.label;
    
    setMicroGoals(prev => prev.map(g => g._id === id ? { ...g, label: editTaskLabel } : g));
    setEditingTaskId(null);

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/api/goals/micro/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ label: editTaskLabel, done: currentTask?.done }) 
        });
        if(!res.ok) throw new Error("Failed to update");
    } catch(err) {
        setMicroGoals(prev => prev.map(g => g._id === id ? { ...g, label: previousLabel || "" } : g));
        toast.error("Lỗi khi cập nhật nhiệm vụ");
    }
  };

  const openCheckinModal = (week: number) => {
      const existingLog = goal?.weekly_log?.find((l: WeeklyLog) => l.week === week);
      setCheckinData({ 
          weight: existingLog ? String(existingLog.weight) : '', 
          feeling: existingLog ? existingLog.feeling : 'normal' 
      });
      setCheckinModal({ isOpen: true, week });
  };

  const submitCheckin = async () => {
      const w = Number(checkinData.weight);
      if (!w || w < 20 || w > 300) { 
          toast.error("Vui lòng nhập cân nặng hiện tại hợp lý."); 
          return; 
      }
      const token = localStorage.getItem("token");
      try {
          // 1. Cập nhật biểu đồ Goal (Tuần)
          const res = await fetch(`http://localhost:8000/api/goals/checkin/${goal._id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ week: checkinModal.week, weight: w, feeling: checkinData.feeling })
          });

          // 2. GỌI API ĐỒNG BỘ CÂN NẶNG LÊN DATABASE PROFILE
          const profileRes = await fetch('http://localhost:8000/api/users/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ profile: { weight_kg: w } })
          });

          let currentHeightStr = "170"; // Fallback height
          if (profileRes.ok) {
              const updatedData = await profileRes.json();
              const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
              storedUser.profile = updatedData.profile;
              currentHeightStr = updatedData.profile?.height_cm || currentHeightStr;
              localStorage.setItem('user', JSON.stringify(storedUser)); 
              setCurrentGlobalWeight(w);
          }

          // 3. ĐỒNG BỘ VÀO LỊCH SỬ CỦA TRANG OVERVIEW (bodyCheckinHistory)
          const bmi = w / Math.pow(Number(currentHeightStr) / 100, 2);
          const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const newEntry = { date: dateLabel, weight: w, height: Number(currentHeightStr), bmi: Number(bmi.toFixed(1)) };
          
          const storedHistory = localStorage.getItem('bodyCheckinHistory');
          let historyArray = [];
          if (storedHistory) {
              try { historyArray = JSON.parse(storedHistory); } catch (e) {}
          }
          const todayIndex = historyArray.findIndex((item: any) => item.date === dateLabel);
          if (todayIndex >= 0) {
              historyArray[todayIndex] = newEntry; // Ghi đè nếu cùng ngày
          } else {
              historyArray.unshift(newEntry); // Thêm mới lên đầu
          }
          localStorage.setItem('bodyCheckinHistory', JSON.stringify(historyArray));

          // 4. Hoàn tất UI
          if(res.ok) {
              toast.success(`Đã cập nhật thể trạng thành công!`);
              setCheckinModal({ isOpen: false, week: 1 });
              fetchGoalData();
          }
      } catch (err) {
          toast.error("Lỗi khi cập nhật");
      }
  };

  const completedTasks = microGoals.filter(g => g.done).length;
  const totalTasks = microGoals.length || 1;
  const overallProgress = microGoals.length > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  useEffect(() => {
    if (overallProgress === 100 && microGoals.length > 0 && !isEditingGoal) {
      setShowCongrats(true);
    }
  }, [overallProgress, microGoals.length, isEditingGoal]);

  const calculatePhaseProgress = (startWeek: number, endWeek: number) => {
      const actualEndWeek = Math.min(endWeek, totalDurationWeeks);
      const tasksInPhase = microGoals.filter(g => g.week >= startWeek && g.week <= actualEndWeek);
      if (tasksInPhase.length === 0) return 0;
      const doneTasksInPhase = tasksInPhase.filter(g => g.done).length;
      return Math.round((doneTasksInPhase / tasksInPhase.length) * 100);
  };

  const chunkSize = Math.ceil(totalDurationWeeks / 3);
  const phasesData: Phase[] = goal?.phases?.length > 0 ? goal.phases.map((p: any) => ({
      title: p.title,
      desc: p.desc,
      startWeek: p.startWeek,
      endWeek: p.endWeek,
      progress: calculatePhaseProgress(p.startWeek, p.endWeek)
  })) : [
      { title: 'Phase 1: Nền tảng', desc: `Xây dựng thói quen cơ bản.`, startWeek: 1, endWeek: chunkSize, progress: calculatePhaseProgress(1, chunkSize) },
      { title: 'Phase 2: Bứt phá', desc: `Tăng cường cường độ.`, startWeek: chunkSize+1, endWeek: chunkSize*2, progress: calculatePhaseProgress(chunkSize+1, chunkSize*2) },
      { title: 'Phase 3: Về đích', desc: `Tối ưu hóa kết quả.`, startWeek: chunkSize*2+1, endWeek: totalDurationWeeks, progress: calculatePhaseProgress(chunkSize*2+1, totalDurationWeeks) }
  ];

  const logs = goal?.weekly_log?.sort((a: any, b: any) => a.week - b.week) || [];
  const hasLogs = logs.length > 0;
  
  // LOGIC ĐỒNG BỘ: Luôn dùng cân nặng hiện tại tuyệt đối nhất
  const currentWeightDisplay = currentGlobalWeight !== 'N/A' ? currentGlobalWeight : (hasLogs ? logs[logs.length - 1].weight : 'N/A');

  let chartPoints = "";
  let targetY = 0;
  const svgWidth = 800;
  const svgHeight = 200;
  const padTop = 30;
  const padBottom = 40;
  const padX = 40;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padTop - padBottom;

  if (hasLogs) {
      const targetW = goal?.target_weight || logs[0].weight;
      const weights = logs.map((l: any) => l.weight).concat(targetW);
      const minW = Math.min(...weights) - 2; 
      const maxW = Math.max(...weights) + 2;
      const range = maxW - minW || 1; 
      
      chartPoints = logs.map((log: any, idx: number) => {
          const x = padX + (idx / Math.max(logs.length - 1, 1)) * chartW;
          const y = padTop + chartH - ((log.weight - minW) / range) * chartH;
          return `${x},${y}`;
      }).join(" ");

      targetY = padTop + chartH - ((targetW - minW) / range) * chartH;
  }

  if (loading) return <Layout><div className="p-10 text-center font-bold text-slate-500">Đang tải hành trình...</div></Layout>;

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        
        {!isProValid && (
            <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 p-10 rounded-3xl max-w-md text-center shadow-2xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
                    <span className="material-symbols-outlined text-6xl text-amber-500 mb-4 relative z-10">workspace_premium</span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 relative z-10">Tính năng dành cho Pro</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed relative z-10">
                        Lộ trình Mục tiêu cá nhân hóa do AI phân tích yêu cầu gói HealthMate Pro. Nâng cấp để mở khóa toàn bộ quyền năng.
                    </p>
                    <button onClick={() => navigate('/subscription')} className="w-full py-3.5 bg-primary text-slate-900 font-bold rounded-xl shadow-lg hover:brightness-110 transition-all relative z-10">
                        Xem chi tiết & Nâng cấp
                    </button>
                    <button onClick={() => navigate('/overview')} className="w-full mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors relative z-10">
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        )}
        
        <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full relative z-10">
          
          <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fitness Goals</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Theo dõi tiến độ, cập nhật thể trạng và chinh phục mục tiêu của bạn.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={handleFetchHistory} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm flex items-center gap-2 shadow-sm">
                <Icon name="history" className="text-[18px]" /> Lịch sử
              </button>
              
              {!isEditingGoal && goal && (
                <button onClick={handleResetGoal} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/30 transition-all text-sm flex items-center gap-2 shadow-sm">
                  <Icon name="restart_alt" className="text-[18px]" /> Đặt lại
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Thông tin Hành trình</h2>
              <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                {isEditingGoal ? (
                  <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tùy chỉnh lộ trình của bạn</h3>
                    {!goal && (
                      <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                          <Icon name="auto_fix_high" className="text-primary mt-0.5" />
                          <div>
                              <p className="text-sm font-bold text-primary mb-1">Đã tự động điền gợi ý từ AI</p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Dựa vào hồ sơ BMI của bạn, hệ thống khuyến nghị mục tiêu: <b>{mapGoalTypeToDisplay(formData.goal_type)}</b>. Bạn có thể sửa đổi bất kỳ thông số nào bên dưới trước khi tạo.</p>
                          </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tên hành trình</label>
                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary font-bold" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Loại Mục Tiêu</label>
                        <select value={formData.goal_type} onChange={e => setFormData({...formData, goal_type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary">
                          <option value="muscle_gain">Tăng cơ / Tăng cân (Bulking)</option>
                          <option value="fat_loss">Giảm mỡ / Siết cơ (Cutting)</option>
                          <option value="endurance">Tăng sức bền</option>
                          <option value="maintain">Duy trì cân nặng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Thời gian (Tuần) [1-52]</label>
                        <input type="number" min={1} max={52} value={formData.duration_weeks} onChange={e => setFormData({...formData, duration_weeks: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Số ngày tập/tuần [1-7]</label>
                        <input type="number" min={1} max={7} value={formData.commitment_days_per_week} onChange={e => setFormData({...formData, commitment_days_per_week: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mức độ hiện tại</label>
                        <select value={formData.fitness_level} onChange={e => setFormData({...formData, fitness_level: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary">
                          <option value="beginner">Người mới (Beginner)</option>
                          <option value="intermediate">Trung bình (Intermediate)</option>
                          <option value="advanced">Nâng cao (Advanced)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cân nặng mục tiêu (kg)</label>
                        <input type="number" value={formData.target_weight} onChange={e => setFormData({...formData, target_weight: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Chỉ số cần đạt</label>
                        <input value={formData.target_health_metric} onChange={e => setFormData({...formData, target_health_metric: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" placeholder="VD: Squat 100kg" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Lời tâm sự / Motivation (AI sẽ đọc)</label>
                        <textarea value={formData.motivation} onChange={e => setFormData({...formData, motivation: e.target.value})} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm resize-none outline-none focus:border-primary" placeholder="Lý do bạn muốn thay đổi..." />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end items-center mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                      {goal && <button onClick={() => setIsEditingGoal(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Hủy</button>}
                      <button onClick={handleGenerateAIRoadmap} disabled={loadingAI} className="px-6 py-2.5 bg-primary text-slate-900 rounded-lg text-sm font-bold hover:brightness-110 flex items-center gap-2 shadow-sm transition-all">
                        <Icon name="auto_awesome" className="text-base"/> {loadingAI ? 'AI Đang tính toán...' : 'Lưu & Tạo lộ trình bằng AI'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-2">{goal?.title}</h2>
                        <p className="text-sm font-bold text-primary bg-primary/10 inline-block px-3 py-1 rounded-full">{mapGoalTypeToDisplay(goal?.goal_type)}</p>
                      </div>
                      <button onClick={() => setIsEditingGoal(true)} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-sm hover:text-primary transition-colors bg-slate-50 dark:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Icon name="edit" className="text-[16px]" /> Sửa lộ trình
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 mb-8">
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Thời gian</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm">{goal?.duration_weeks} Tuần</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Cam kết tập</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm">{goal?.commitment_days_per_week} Ngày/Tuần</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Cân nặng C.Tại</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm text-primary">{currentWeightDisplay} {currentWeightDisplay !== 'N/A' && 'kg'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Mục tiêu cân</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm">{goal?.target_weight} kg</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Tiến độ tổng quan</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
                            </div>
                            <span className="text-xs font-bold">{overallProgress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* WEEKLY ACTION PLAN */}
              {!isEditingGoal && (
                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Lịch trình chi tiết (Action Plan)</h3>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {Array.from({ length: totalDurationWeeks }).map((_, i) => {
                      const weekNum = i + 1;
                      const weekTasksRaw = microGoals.filter(g => g.week === weekNum);
                      
                      const weekTasks = [...weekTasksRaw].sort((a, b) => {
                          const numA = parseInt(a.label.match(/Day (\d+)/i)?.[1] || "0");
                          const numB = parseInt(b.label.match(/Day (\d+)/i)?.[1] || "0");
                          return numA - numB;
                      });

                      const weekDone = weekTasks.filter(g => g.done).length;
                      const isExpanded = expandedWeek === weekNum;
                      const isCheckedIn = goal?.weekly_log?.some((l: WeeklyLog) => l.week === weekNum);

                      return (
                        <div key={weekNum} className={`border rounded-xl overflow-hidden transition-colors duration-300 ${isExpanded ? 'border-primary/40 bg-slate-50/50 dark:bg-slate-800/30 shadow-sm' : 'border-slate-200 dark:border-slate-700'}`}>
                          <button onClick={() => setExpandedWeek(isExpanded ? 0 : weekNum)} className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">Tuần {weekNum}</span>
                            <div className="flex items-center gap-3">
                                {isCheckedIn && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Đã check-in</span>}
                                {weekTasks.length > 0 && <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{weekDone}/{weekTasks.length} Xong</span>}
                                <Icon name={isExpanded ? "expand_less" : "expand_more"} className="text-slate-500 text-lg"/>
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="p-4 bg-white dark:bg-slate-900 flex flex-col gap-3">
                              {weekTasks.length > 0 ? weekTasks.map((task) => {
                                const isEditing = editingTaskId === task._id;
                                const parts = task.label.split(': ');
                                const hasDayPrefix = parts.length > 1 && parts[0].toLowerCase().includes('day');
                                
                                return (
                                <div key={task._id} className="flex items-start justify-between gap-3 group bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <input type="checkbox" checked={task.done} onChange={() => toggleMicroGoal(task._id, task.done)} className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all shrink-0" />
                                      
                                      {/* TRẠNG THÁI EDIT HOẶC VIEW CHO TỪNG TASK */}
                                      {isEditing ? (
                                          <div className="flex-1 flex gap-2 w-full">
                                              <input 
                                                  value={editTaskLabel} 
                                                  onChange={e => setEditTaskLabel(e.target.value)} 
                                                  onKeyDown={e => e.key === 'Enter' && saveEditTask(task._id)}
                                                  className="flex-1 bg-white dark:bg-slate-900 border border-primary/50 focus:border-primary rounded px-2.5 py-1 text-sm outline-none text-slate-900 dark:text-white" 
                                                  autoFocus 
                                              />
                                              <button onClick={() => saveEditTask(task._id)} className="text-green-500 hover:text-green-600 bg-green-50 dark:bg-green-500/10 p-1 rounded transition-colors"><Icon name="check" className="text-[18px]"/></button>
                                              <button onClick={() => setEditingTaskId(null)} className="text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 p-1 rounded transition-colors"><Icon name="close" className="text-[18px]"/></button>
                                          </div>
                                      ) : (
                                          <div className="flex-1 flex flex-col items-start min-w-0 pr-2">
                                              <span className={`text-sm leading-snug transition-all whitespace-normal break-words w-full ${task.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                                                  {hasDayPrefix ? (
                                                      <><span className="font-bold text-primary">{parts[0]}: </span>{parts.slice(1).join(': ')}</>
                                                  ) : task.label}
                                              </span>
                                          </div>
                                      )}
                                  </div>

                                  {/* ICON SỬA (Hiện khi hover) */}
                                  {!isEditing && (
                                      <button onClick={() => { setEditingTaskId(task._id); setEditTaskLabel(task.label); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all p-1 shrink-0">
                                          <Icon name="edit" className="text-[16px]" />
                                      </button>
                                  )}
                                </div>
                              )}) : (
                                <div className="text-center py-4 text-sm text-slate-500 italic">Đang chờ AI khởi tạo lộ trình...</div>
                              )}
                              
                              <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-4">
                                  <button onClick={() => openCheckinModal(weekNum)} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${isCheckedIn ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-primary text-slate-900 hover:brightness-110 shadow-sm'}`}>
                                      <Icon name="monitor_weight" className="text-lg" /> Cập nhật thể trạng (Check-in)
                                  </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* ─── CỘT PHẢI: ROADMAP TIMELINE & TRACKING CHART ─── */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Phân tích & Biểu đồ</h2>
              {!isEditingGoal && (
                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Biểu đồ Cân nặng</h3>
                   {hasLogs ? (
                       <div className="w-full h-48 mt-6 relative pb-6 pl-6">
                           <div className="absolute inset-0 border-b-2 border-l-2 border-slate-200 dark:border-slate-700 ml-6 mb-6"></div>
                           {goal?.target_weight && (
                               <div className="absolute w-[calc(100%-24px)] ml-6 border-t border-dashed border-red-400 z-0" style={{top: `${targetY}px`}}>
                                   <span className="absolute -top-4 right-0 text-[10px] text-red-500 font-bold">Mục tiêu: {goal.target_weight}kg</span>
                               </div>
                           )}
                           <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible z-10 relative">
                               <polyline points={chartPoints} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                               {logs.map((log: any, idx: number) => {
                                   const targetW = goal?.target_weight || logs[0].weight;
                                   const weights = logs.map((l: any) => l.weight).concat(targetW);
                                   const minW = Math.min(...weights) - 2; 
                                   const maxW = Math.max(...weights) + 2;
                                   const range = maxW - minW || 1;
                                   const x = padX + (idx / Math.max(logs.length - 1, 1)) * chartW;
                                   const y = padTop + chartH - ((log.weight - minW) / range) * chartH;
                                   return (
                                       <g key={idx}>
                                           <circle cx={x} cy={y} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" className="cursor-pointer hover:r-8 transition-all" />
                                           <text x={x} y={y - 15} fill="currentColor" fontSize="16" fontWeight="bold" textAnchor="middle" className="text-slate-700 dark:text-slate-300">
                                               {log.weight}
                                           </text>
                                           <text x={x} y={svgHeight - 10} fill="#64748b" fontSize="14" fontWeight="bold" textAnchor="middle">
                                               T{log.week}
                                           </text>
                                       </g>
                                   )
                               })}
                           </svg>
                       </div>
                   ) : (
                       <div className="h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                           <Icon name="show_chart" className="text-3xl text-slate-300 mb-2"/>
                           <p className="text-sm text-slate-500 font-medium">Chưa có dữ liệu. Hãy check-in để vẽ biểu đồ!</p>
                       </div>
                   )}
                </section>
              )}

              <section className="bg-[#111827] text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-16 -mb-16 blur-3xl pointer-events-none" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-2">
                      <Icon name="timeline" className="text-primary" />
                      <h2 className="text-lg font-bold">Các Giai Đoạn (Phases)</h2>
                  </div>
                  <span className="text-xl font-black text-primary">{overallProgress}%</span>
                </div>

                <div className="relative pl-6 space-y-8 z-10">
                  {phasesData.map((phase, index) => {
                    const prog = phase.progress || 0;
                    const isCompleted = prog === 100;
                    const isActive = prog > 0 && prog < 100;
                    
                    const colorClass = isCompleted ? 'text-primary' : isActive ? 'text-primary' : 'text-slate-500';
                    const bgColorClass = isCompleted ? 'bg-primary border-primary' : isActive ? 'bg-slate-800 border-primary' : 'bg-slate-800 border-slate-600';

                    return (
                      <div key={index} className={`relative transition-all duration-500 ${isCompleted || isActive ? 'opacity-100' : 'opacity-60'}`}>
                        {index !== phasesData.length - 1 && (
                            <div className="absolute left-[-19px] top-6 bottom-[-24px] w-[2px] bg-slate-700 overflow-hidden">
                                <div className="bg-primary w-full transition-all duration-700" style={{ height: `${prog}%` }} />
                            </div>
                        )}
                        <div className={`absolute left-[-24px] top-1.5 h-3 w-3 rounded-full border-2 z-10 transition-all duration-500 ${bgColorClass}`} />
                        <div className="pb-2">
                            <div className="flex justify-between items-center mb-1">
                                <p className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 ${colorClass}`}>
                                Giai đoạn {index + 1} {isCompleted && <Icon name="check_circle" className="text-[12px]" />}
                                </p>
                                {prog > 0 && !isCompleted && <span className="text-[10px] font-bold text-primary">{prog}%</span>}
                            </div>
                            <h4 className={`text-sm font-bold mb-2 ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>{phase.title}</h4>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                                <div className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-primary' : 'bg-amber-400'}`} style={{width: `${prog}%`}}/>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{phase.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button onClick={() => setShowRoadmapDetail(true)} className="w-full mt-10 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold text-white transition-all border border-white/10 relative z-10">
                  Xem lộ trình bản Full
                </button>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL LỊCH SỬ MỤC TIÊU */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="history" className="text-primary"/> Lịch sử mục tiêu của bạn
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1"><Icon name="close" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
               {historyGoals.length > 0 ? historyGoals.map(hg => (
                   <div key={hg._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
                       <div className="flex justify-between items-start mb-3">
                           <div>
                               <h3 className="font-bold text-slate-900 dark:text-white">{hg.title}</h3>
                               <p className="text-xs text-slate-500 font-medium">{mapGoalTypeToDisplay(hg.goal_type)}</p>
                           </div>
                           <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-bold uppercase">Archived</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                           <div>
                               <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Thời gian</p>
                               <p className="font-bold text-slate-700 dark:text-slate-300">{hg.duration_weeks} Tuần ({hg.commitment_days_per_week} buổi/tuần)</p>
                           </div>
                           <div>
                               <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Mục tiêu cân nặng</p>
                               <p className="font-bold text-slate-700 dark:text-slate-300">{hg.target_weight} kg</p>
                           </div>
                       </div>
                   </div>
               )) : (
                   <div className="text-center py-10">
                       <Icon name="inbox" className="text-5xl text-slate-300 dark:text-slate-600 mb-3 block mx-auto"/>
                       <p className="text-slate-500">Chưa có mục tiêu nào được lưu trữ.</p>
                   </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* CÁC MODALS KHÁC */}
      {dailyAlert.isOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm text-center shadow-2xl relative overflow-hidden border border-slate-100 dark:border-slate-800">
                <Icon name={dailyAlert.type === 'good' ? "mood" : dailyAlert.type === 'bad' ? "warning" : "psychology"} className={`text-6xl mb-4 ${dailyAlert.type === 'good' ? 'text-green-500' : 'text-primary'}`} />
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{dailyAlert.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{dailyAlert.message}</p>
                <button onClick={() => setDailyAlert({...dailyAlert, isOpen: false})} className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-900 dark:text-white transition-colors">
                    Đã rõ, Cảm ơn!
                </button>
             </div>
        </div>
      )}

      {checkinModal.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Check-in Thể Trạng</h3>
                    <p className="text-sm text-slate-500 text-center mb-6">Cập nhật số đo hôm nay để AI theo dõi sát sao!</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cân nặng hiện tại (kg)</label>
                            <input type="number" value={checkinData.weight} onChange={e => setCheckinData({...checkinData, weight: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-lg font-bold text-center outline-none focus:border-primary" placeholder="VD: 69.5" autoFocus />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Hôm nay bạn thấy thế nào?</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Tuyệt vời', 'Bình thường', 'Mệt mỏi'].map((feel, idx) => {
                                    const value = ['great', 'normal', 'exhausted'][idx];
                                    return (
                                    <button key={value} onClick={() => setCheckinData({...checkinData, feeling: value})} className={`py-2 rounded-lg text-sm font-bold capitalize transition-colors border ${checkinData.feeling === value ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                        {feel}
                                    </button>
                                )})}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setCheckinModal({isOpen: false, week: 1})} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Hủy</button>
                    <button onClick={submitCheckin} className="px-6 py-2 bg-primary text-slate-900 text-sm font-bold rounded-lg hover:brightness-110 transition-all shadow-sm">Lưu dữ liệu</button>
                </div>
            </div>
        </div>
      )}

      {showCongrats && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-md mx-4 text-center shadow-2xl relative overflow-hidden w-full border border-primary/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-16 -mb-16 blur-3xl pointer-events-none" />
            <div className="relative z-10 animate-bounce">
                <div className="text-6xl mb-4">🎉</div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 relative z-10">Chúc mừng bạn!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm relative z-10">
              Bạn đã hoàn thành 100% nhiệm vụ trong mục tiêu <span className="font-bold text-primary">{goal?.title}</span>. Bạn thực sự rất tuyệt vời!
            </p>
            <div className="text-5xl mb-8 relative z-10 animate-pulse">🏆</div>
            <button onClick={handleCompleteGoalAndReset} className="bg-primary text-slate-900 w-full py-3 rounded-xl font-bold hover:brightness-110 transition-all relative z-10 shadow-lg shadow-primary/30">
              Lưu trữ & Bắt đầu chặng mới
            </button>
          </div>
        </div>
      )}

      {showRoadmapDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-900 p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-10">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="map" className="text-primary"/> Lộ trình chi tiết {totalDurationWeeks} Tuần
              </h2>
              <button onClick={() => setShowRoadmapDetail(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"><Icon name="close" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                {Array.from({ length: totalDurationWeeks }).map((_, i) => {
                  const week = i + 1;
                  const currentPhase = phasesData.find(p => week >= p.startWeek && week <= p.endWeek);
                  const phaseIndex = phasesData.findIndex(p => p.title === currentPhase?.title) + 1;
                  const weekTasksRaw = microGoals.filter(g => g.week === week);
                  
                  const weekTasks = [...weekTasksRaw].sort((a, b) => {
                      const numA = parseInt(a.label.match(/Day (\d+)/i)?.[1] || "0");
                      const numB = parseInt(b.label.match(/Day (\d+)/i)?.[1] || "0");
                      return numA - numB;
                  });

                  return (
                  <div key={week} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">{week}</div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group-hover:border-primary/30 transition-colors relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tuần {week}</h4>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Giai đoạn {phaseIndex}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                        {weekTasks.length > 0 ? weekTasks.map((t, idx) => {
                           const parts = t.label.split(': ');
                           const hasDayPrefix = parts.length > 1 && parts[0].toLowerCase().includes('day');
                           return (
                           <p key={idx} className="flex items-start gap-1.5">
                             <span className="text-primary mt-0.5">•</span> 
                             <span className="whitespace-normal break-words">{hasDayPrefix ? <><span className="font-bold">{parts[0]}: </span>{parts.slice(1).join(': ')}</> : t.label}</span>
                           </p>
                        )}) : <p className="italic text-slate-400">Đang chờ AI tạo lộ trình...</p>}
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FitnessGoal;