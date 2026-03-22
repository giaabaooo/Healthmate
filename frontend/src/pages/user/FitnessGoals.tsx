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
    case 'fat_loss': return 'Fat Loss / Cutting';
    case 'muscle_gain': return 'Hypertrophy / Muscle Gain';
    case 'endurance': return 'Endurance / Stamina';
    case 'maintain': return 'Maintain Weight';
    default: return 'General Health';
  }
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
  
  // Check-in Modal States
  const [checkinModal, setCheckinModal] = useState({ isOpen: false, week: 1 });
  const [checkinData, setCheckinData] = useState({ weight: '', feeling: 'normal' });

  // Form States
  const [formData, setFormData] = useState({
    title: 'My Transformation Journey',
    goal_type: 'muscle_gain',
    duration_weeks: 12,
    commitment_days_per_week: 5,
    motivation: '',
    target_weight: '',
    target_health_metric: '',
    fitness_level: 'beginner'
  });

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
      } else {
        setIsEditingGoal(true); 
      }
    } catch (error) { 
      setIsEditingGoal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalData();
    getTodayProgress().then(setProgress).catch(console.error);
  }, []);

  const handleGenerateAIRoadmap = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      if(goal?._id) {
          if(!window.confirm("Generating a new AI roadmap will reset your current journey. Proceed?")) return;
      }

      setLoadingAI(true);
      toast.loading("AI is analyzing your profile to generate a personalized roadmap...", { id: 'ai' });
      try {
          const res = await fetch(`http://localhost:8000/api/goals/generate-roadmap`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(formData)
          });

          if(res.ok) {
              toast.success("Personalized AI Roadmap generated!", { id: 'ai' });
              fetchGoalData(); 
          } else {
              toast.error("Failed to generate AI Roadmap.", { id: 'ai' });
          }
      } catch (err) {
          toast.error("Network error.", { id: 'ai' });
      } finally {
          setLoadingAI(false);
      }
  };

  const handleResetGoal = () => {
    if (window.confirm("Are you sure you want to setup a new goal?")) {
      setIsEditingGoal(true);
      setGoal(null);
      setMicroGoals([]);
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
        toast.error("Error updating status");
    }
  };

  // Logic Weekly Check-in
  const openCheckinModal = (week: number) => {
      const existingLog = goal?.weekly_log?.find((l: WeeklyLog) => l.week === week);
      setCheckinData({ 
          weight: existingLog ? String(existingLog.weight) : '', 
          feeling: existingLog ? existingLog.feeling : 'normal' 
      });
      setCheckinModal({ isOpen: true, week });
  };

  const submitCheckin = async () => {
      if(!checkinData.weight) { toast.error("Please enter your weight"); return; }
      const token = localStorage.getItem("token");
      try {
          const res = await fetch(`http://localhost:8000/api/goals/checkin/${goal._id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ week: checkinModal.week, weight: Number(checkinData.weight), feeling: checkinData.feeling })
          });
          if(res.ok) {
              toast.success(`Check-in for Week ${checkinModal.week} successful!`);
              setCheckinModal({ isOpen: false, week: 1 });
              fetchGoalData(); 
          }
      } catch (err) {
          toast.error("Failed to check-in");
      }
  };

  // Tính % tiến độ tổng
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
      { title: 'Phase 1: Foundation', desc: `Building basic habits.`, startWeek: 1, endWeek: chunkSize, progress: calculatePhaseProgress(1, chunkSize) },
      { title: 'Phase 2: Progression', desc: `Increasing intensity.`, startWeek: chunkSize+1, endWeek: chunkSize*2, progress: calculatePhaseProgress(chunkSize+1, chunkSize*2) },
      { title: 'Phase 3: Peak', desc: `Finalizing results.`, startWeek: chunkSize*2+1, endWeek: totalDurationWeeks, progress: calculatePhaseProgress(chunkSize*2+1, totalDurationWeeks) }
  ];

  // Logic vẽ Biểu đồ SVG (Weight Tracker) chuẩn Absolute Coordinates
  const logs = goal?.weekly_log?.sort((a: any, b: any) => a.week - b.week) || [];
  const hasLogs = logs.length > 0;
  
  // Lấy cân nặng hiện tại từ checkin mới nhất, nếu không có lấy mặc định
  const currentWeightDisplay = hasLogs ? logs[logs.length - 1].weight : (goal?.target_weight || 'N/A');

  // SVG Chart Calculation
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
      const range = maxW - minW || 1; // tránh chia cho 0
      
      chartPoints = logs.map((log: any, idx: number) => {
          const x = padX + (idx / Math.max(logs.length - 1, 1)) * chartW;
          const y = padTop + chartH - ((log.weight - minW) / range) * chartH;
          return `${x},${y}`;
      }).join(" ");

      targetY = padTop + chartH - ((targetW - minW) / range) * chartH;
  }

  if (loading) return <Layout><div className="p-10 text-center font-bold text-slate-500">Loading your journey...</div></Layout>;

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
          
          <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manage Goals</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Track your progress, update weekly stats, and reach your target.</p>
            </div>
            {!isEditingGoal && goal && (
              <button onClick={handleResetGoal} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center gap-2 shadow-sm">
                <Icon name="history" className="text-base" /> History / Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* ─── CỘT TRÁI: SETUP & MICRO GOALS ─── */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Goal Setup & Action Plan</h2>
              
              {/* PRIMARY GOAL CARD */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                {isEditingGoal ? (
                  <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Setup Your Journey</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Journey Title</label>
                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Goal Type</label>
                        <select value={formData.goal_type} onChange={e => setFormData({...formData, goal_type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary">
                          <option value="muscle_gain">Muscle Gain / Hypertrophy</option>
                          <option value="fat_loss">Fat Loss / Cutting</option>
                          <option value="endurance">Endurance</option>
                          <option value="maintain">Maintain Weight</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Duration (Weeks)</label>
                        <input type="number" min={1} max={52} value={formData.duration_weeks} onChange={e => setFormData({...formData, duration_weeks: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Workout Days / Week</label>
                        <input type="number" min={1} max={7} value={formData.commitment_days_per_week} onChange={e => setFormData({...formData, commitment_days_per_week: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Target Weight (kg)</label>
                        <input type="number" value={formData.target_weight} onChange={e => setFormData({...formData, target_weight: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" placeholder="e.g. 70" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Target Health Metric</label>
                        <input value={formData.target_health_metric} onChange={e => setFormData({...formData, target_health_metric: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary" placeholder="e.g. Squat 100kg" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Fitness Level</label>
                        <select value={formData.fitness_level} onChange={e => setFormData({...formData, fitness_level: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary">
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Motivation</label>
                        <textarea value={formData.motivation} onChange={e => setFormData({...formData, motivation: e.target.value})} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm resize-none outline-none focus:border-primary" placeholder="I want to feel stronger..." />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end items-center mt-2 border-t border-slate-100 pt-4">
                      {goal && <button onClick={() => setIsEditingGoal(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button>}
                      <button onClick={handleGenerateAIRoadmap} disabled={loadingAI} className="px-6 py-2.5 bg-primary text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2 shadow-sm transition-all">
                        <Icon name="auto_awesome" className="text-base"/> {loadingAI ? 'AI generating...' : 'Generate Roadmap with AI'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    {/* Header Goal */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1.5">{goal?.title}</h2>
                        <p className="text-sm font-bold text-slate-500">{mapGoalTypeToDisplay(goal?.goal_type)}</p>
                      </div>
                      <button onClick={() => setIsEditingGoal(true)} className="text-slate-400 hover:text-slate-700 p-1.5 bg-slate-50 rounded-full border border-slate-200"><Icon name="edit" className="text-[18px]" /></button>
                    </div>

                    {/* Grid 8 Thông Tin (Phục hồi chuẩn thiết kế) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 mb-8">
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Goal Type</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{mapGoalTypeToDisplay(goal?.goal_type).split('/')[0].trim()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Duration</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm">{goal?.duration_weeks} Weeks</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Status</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm capitalize">{goal?.status}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Commitment</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm">{goal?.commitment_days_per_week} Days/Wk</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Current Weight</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm">{currentWeightDisplay} {currentWeightDisplay !== 'N/A' && 'kg'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Target Metric</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{goal?.target_health_metric || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Fitness Level</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm capitalize">{goal?.fitness_level}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Overall Progress</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* Motivation UI chuẩn xanh lá nhạt */}
                    {goal?.motivation && (
                      <div className="bg-[#eefcf3] dark:bg-primary/10 border border-[#bbf0ce] dark:border-primary/20 rounded-xl p-4">
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Motivation</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200 italic leading-snug">"{goal.motivation}"</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* WEEKLY ACTION PLAN (MICRO GOALS Accordion) */}
              {!isEditingGoal && (
                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Weekly Action Plan</h3>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {Array.from({ length: totalDurationWeeks }).map((_, i) => {
                      const weekNum = i + 1;
                      const weekTasks = microGoals.filter(g => g.week === weekNum);
                      const weekDone = weekTasks.filter(g => g.done).length;
                      const weekProgress = weekTasks.length > 0 ? Math.round((weekDone / weekTasks.length) * 100) : 0;
                      const isExpanded = expandedWeek === weekNum;
                      
                      const isCheckedIn = goal?.weekly_log?.some((l: WeeklyLog) => l.week === weekNum);

                      return (
                        <div key={weekNum} className={`border rounded-xl overflow-hidden transition-colors duration-300 ${isExpanded ? 'border-primary/40 bg-slate-50/50 dark:bg-slate-800/30 shadow-sm' : 'border-slate-200 dark:border-slate-700'}`}>
                          <button onClick={() => setExpandedWeek(isExpanded ? 0 : weekNum)} className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">Week {weekNum}</span>
                            <div className="flex items-center gap-3">
                                {isCheckedIn && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Checked-in</span>}
                                {weekTasks.length > 0 && <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{weekDone}/{weekTasks.length} Done</span>}
                                <Icon name={isExpanded ? "expand_less" : "expand_more"} className="text-slate-500 text-lg"/>
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="p-4 bg-white dark:bg-slate-900 flex flex-col gap-3">
                              {weekTasks.length > 0 ? weekTasks.map((task) => (
                                <div key={task._id} className="flex items-start gap-3 group bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                  <input type="checkbox" checked={task.done} onChange={() => toggleMicroGoal(task._id, task.done)} className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all shrink-0" />
                                  <div className="flex-1 flex flex-col items-start min-w-0 pr-2">
                                      <span className={`text-sm leading-snug transition-all whitespace-normal break-words w-full ${task.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                                          {task.label}
                                      </span>
                                      <button onClick={(e) => { e.preventDefault(); navigate('/workouts'); }} className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-[11px] font-bold text-primary hover:bg-primary hover:text-slate-900 transition-colors">
                                        Go to Workouts <Icon name="arrow_forward" className="text-[12px]" />
                                      </button>
                                  </div>
                                </div>
                              )) : (
                                <div className="text-center py-4 text-sm text-slate-500 italic">No tasks generated. Please use AI Roadmap feature.</div>
                              )}
                              
                              <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-4">
                                  <button onClick={() => openCheckinModal(weekNum)} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${isCheckedIn ? 'bg-slate-100 text-slate-500' : 'bg-primary text-slate-900 hover:brightness-110 shadow-sm'}`}>
                                      <Icon name="monitor_weight" className="text-lg" /> {isCheckedIn ? 'Update Check-in Data' : 'Log Weekly Progress (Check-in)'}
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Journey Analytics</h2>
              
              {/* ANALYTICS / TRACKING CHART VỚI SVG CHUẨN */}
              {!isEditingGoal && (
                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Weight Tracking</h3>
                   
                   {hasLogs ? (
                       <div className="w-full h-48 mt-6 relative pb-6 pl-6">
                           {/* Trục X và Trục Y (Border) */}
                           <div className="absolute inset-0 border-b-2 border-l-2 border-slate-200 dark:border-slate-700 ml-6 mb-6"></div>

                           {/* Target Line */}
                           {goal?.target_weight && (
                               <div className="absolute w-[calc(100%-24px)] ml-6 border-t border-dashed border-red-400 z-0" style={{top: `${targetY}px`}}>
                                   <span className="absolute -top-4 right-0 text-[10px] text-red-500 font-bold">Target: {goal.target_weight}kg</span>
                               </div>
                           )}
                           
                           {/* Line Chart SVG sử dụng fixed viewBox để tránh méo ảnh */}
                           <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible z-10 relative">
                               <polyline points={chartPoints} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                               {logs.map((log: any, idx: number) => {
                                   // Cùng thuật toán lấy ra tọa độ x, y
                                   const targetW = goal?.target_weight || logs[0].weight;
                                   const weights = logs.map((l: any) => l.weight).concat(targetW);
                                   const minW = Math.min(...weights) - 2; 
                                   const maxW = Math.max(...weights) + 2;
                                   const range = maxW - minW || 1;
                                   const x = padX + (idx / Math.max(logs.length - 1, 1)) * chartW;
                                   const y = padTop + chartH - ((log.weight - minW) / range) * chartH;
                                   return (
                                       <g key={idx}>
                                           {/* Circle chuẩn không bị oval */}
                                           <circle cx={x} cy={y} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" className="cursor-pointer hover:r-8 transition-all" />
                                           <text x={x} y={y - 15} fill="currentColor" fontSize="16" fontWeight="bold" textAnchor="middle" className="text-slate-700 dark:text-slate-300">
                                               {log.weight}
                                           </text>
                                           <text x={x} y={svgHeight - 10} fill="#64748b" fontSize="14" fontWeight="bold" textAnchor="middle">
                                               W{log.week}
                                           </text>
                                       </g>
                                   )
                               })}
                           </svg>
                       </div>
                   ) : (
                       <div className="h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                           <Icon name="show_chart" className="text-3xl text-slate-300 mb-2"/>
                           <p className="text-sm text-slate-500 font-medium">No check-ins yet. Complete Week 1 to see your chart!</p>
                       </div>
                   )}
                </section>
              )}

              {/* ROADMAP TIMELINE */}
              <section className="bg-[#111827] text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-16 -mb-16 blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-2">
                      <Icon name="timeline" className="text-primary" />
                      <h2 className="text-lg font-bold">Goal Roadmap</h2>
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
                                Phase {index + 1} {isCompleted && <Icon name="check_circle" className="text-[12px]" />}
                                </p>
                                {prog > 0 && !isCompleted && (
                                    <span className="text-[10px] font-bold text-primary">{prog}%</span>
                                )}
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
                  View Detailed Program
                </button>
              </section>

            </div>

          </div>
        </main>
      </div>

      {/* MODAL: WEEKLY CHECK-IN */}
      {checkinModal.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Week {checkinModal.week} Check-in</h3>
                    <p className="text-sm text-slate-500 text-center mb-6">Log your progress to keep the chart updated!</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Current Weight (kg)</label>
                            <input type="number" value={checkinData.weight} onChange={e => setCheckinData({...checkinData, weight: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-lg font-bold text-center outline-none focus:border-primary" placeholder="e.g. 69.5" autoFocus />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">How are you feeling?</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['great', 'normal', 'exhausted'].map(feel => (
                                    <button key={feel} onClick={() => setCheckinData({...checkinData, feeling: feel})} className={`py-2 rounded-lg text-sm font-bold capitalize transition-colors border ${checkinData.feeling === feel ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                        {feel}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setCheckinModal({isOpen: false, week: 1})} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                    <button onClick={submitCheckin} className="px-6 py-2 bg-primary text-slate-900 text-sm font-bold rounded-lg hover:brightness-110 transition-all shadow-sm">Save Log</button>
                </div>
            </div>
        </div>
      )}

      {/* CONGRATULATIONS MODAL */}
      {showCongrats && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-md mx-4 text-center shadow-2xl relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-16 -mb-16 blur-3xl pointer-events-none" />
            <div className="relative z-10 animate-bounce">
                <div className="text-6xl mb-4">🎉</div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 relative z-10">
              Congratulations!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm relative z-10">
              You've successfully completed all tasks and hit 100% on your <span className="font-bold text-primary">{goal?.title}</span> goal. You are amazing!
            </p>
            <div className="text-5xl mb-8 relative z-10 animate-pulse">🏆</div>
            <button onClick={handleCompleteGoalAndReset} className="bg-primary text-slate-900 w-full py-3 rounded-xl font-bold hover:brightness-110 transition-all relative z-10 shadow-lg shadow-primary/30">
              Archive & Start New Journey
            </button>
          </div>
        </div>
      )}

      {/* DETAILED ROADMAP MODAL */}
      {showRoadmapDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-900 p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-10">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="map" className="text-primary"/> {totalDurationWeeks}-Week Detailed Roadmap
              </h2>
              <button onClick={() => setShowRoadmapDetail(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                <Icon name="close" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
                <h3 className="font-bold text-primary mb-2">Program: {mapGoalTypeToDisplay(goal?.goal_type || formData.goal_type)}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">This detailed roadmap breaks down your {totalDurationWeeks}-week journey into actionable weekly phases, tailored exactly to your primary goal and physical metrics.</p>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                {Array.from({ length: totalDurationWeeks }).map((_, i) => {
                  const week = i + 1;
                  const currentPhase = phasesData.find(p => week >= p.startWeek && week <= p.endWeek);
                  const phaseIndex = phasesData.findIndex(p => p.title === currentPhase?.title) + 1;
                  const weekTasks = microGoals.filter(g => g.week === week);

                  return (
                  <div key={week} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      {week}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group-hover:border-primary/30 transition-colors relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Week {week}</h4>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Phase {phaseIndex}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                        {weekTasks.length > 0 ? weekTasks.map((t, idx) => (
                           <p key={idx} className="flex items-start gap-1.5">
                             <span className="text-primary mt-0.5">•</span> 
                             <span className="whitespace-normal break-words">{t.label}</span>
                           </p>
                        )) : (
                           <p className="italic text-slate-400">Waiting for AI generation...</p>
                        )}
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