import Layout from '../../components/Layout';
import { useEffect, useState } from "react";
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

// ─── Sub-components ───────────────────────────────────────────────────────────
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const mapGoalTypeToDisplay = (type: string) => {
  switch (type) {
    case 'fat_loss': return 'Fat Loss';
    case 'muscle_gain': return 'Muscle Gain';
    case 'endurance': return 'Endurance / Stamina';
    case 'maintain': return 'Maintain Weight';
    default: return 'General Health';
  }
};

// Hàm tự động sinh Task theo loại mục tiêu và Giai đoạn (Phase)
const getPredefinedTasks = (goalType: string, week: number, chunkSize: number) => {
    const phase = Math.ceil(week / chunkSize);
    if (goalType === 'muscle_gain') {
        return [
            `Complete ${phase === 1 ? 4 : phase === 2 ? 5 : 4} strength workouts`,
            `Eat protein-rich meals (Target: 1.8g/kg body weight)`,
            `Get 8 hours of sleep for optimal muscle recovery`
        ];
    } else if (goalType === 'fat_loss') {
        return [
            `Complete ${phase === 1 ? 3 : 4} cardio or HIIT sessions`,
            `Maintain a daily caloric deficit of ~500 kcal`,
            `Hit 10,000 steps daily`
        ];
    } else if (goalType === 'endurance') {
        return [
            `Complete ${phase === 1 ? 2 : 3} steady-state endurance sessions`,
            `Do 1 high-intensity interval training (HIIT)`,
            `Perform 15 mins of mobility/stretching daily`
        ];
    } else {
        return [
            `Complete 3 physical activities this week`,
            `Eat at least 3 servings of vegetables daily`,
            `Drink 2 liters of water daily`
        ];
    }
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FitnessGoal = () => {
  const [progress, setProgress] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);
  const [microGoals, setMicroGoals] = useState<MicroGoal[]>([]);
  
  // UI States
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showRoadmapDetail, setShowRoadmapDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);

  // Form States
  const [formData, setFormData] = useState({
    title: 'My Transformation Journey',
    goal_type: 'fat_loss',
    duration_weeks: 12,
    commitment_days_per_week: 4,
    motivation: ''
  });

  const totalDurationWeeks = goal?.duration_weeks || formData.duration_weeks;
  const chunkSize = Math.ceil(totalDurationWeeks / 3);

  const fetchGoalData = async () => {
    setLoading(true);
    try {
      const goalData = await getUserGoal();
      if (goalData && goalData._id) {
        setGoal(goalData);
        setFormData({
          title: goalData.title || 'My Transformation Journey',
          goal_type: goalData.goal_type || 'fat_loss',
          duration_weeks: goalData.duration_weeks || 12,
          commitment_days_per_week: goalData.commitment_days_per_week || 4,
          motivation: goalData.motivation || ''
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

  const handleSaveGoal = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const url = goal?._id 
        ? `http://localhost:8000/api/goals/${goal._id}` 
        : `http://localhost:8000/api/goals`;
      const method = goal?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Goal saved successfully!");
        fetchGoalData(); 
      } else {
        toast.error("Failed to save goal.");
      }
    } catch (error) { toast.error("Network error."); }
  };

  const handleResetGoal = () => {
    if (window.confirm("Are you sure you want to reset your goal? This will let you start a new journey.")) {
      setIsEditingGoal(true);
      setGoal(null);
      setMicroGoals([]);
    }
  };

  // Logic Tick/Untick Micro Goal Auto-generated
  const handleToggleTask = async (week: number, label: string) => {
    const dbRecord = microGoals.find(g => g.week === week && g.label === label);
    const token = localStorage.getItem("token");

    if (dbRecord) {
        // Toggle if exists
        const newStatus = !dbRecord.done;
        setMicroGoals(prev => prev.map(g => g._id === dbRecord._id ? { ...g, done: newStatus } : g));
        try {
            await fetch(`http://localhost:8000/api/goals/micro/${dbRecord._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ done: newStatus })
            });
        } catch(err) {
            setMicroGoals(prev => prev.map(g => g._id === dbRecord._id ? { ...g, done: !newStatus } : g));
            toast.error("Failed to update");
        }
    } else {
        // Create new and mark as done if it doesn't exist
        try {
            const res = await fetch(`http://localhost:8000/api/goals/micro`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ goal_id: goal._id, label, week, done: true })
            });
            if(res.ok) {
                const created = await res.json();
                setMicroGoals(prev => [...prev, created]);
            }
        } catch(err) { toast.error("Failed to update"); }
    }
  };

  // --- Tính toán Roadmap Logic Dần Dần ---
  const calculatePhaseProgress = (startWeek: number, endWeek: number) => {
      const actualEndWeek = Math.min(endWeek, totalDurationWeeks);
      const totalTasksInPhase = (actualEndWeek - startWeek + 1) * 3; // 3 tasks per week
      
      const doneTasksInPhase = microGoals.filter(g => g.week >= startWeek && g.week <= actualEndWeek && g.done).length;
      if (totalTasksInPhase <= 0) return 0;
      
      return Math.round((doneTasksInPhase / totalTasksInPhase) * 100);
  };

  const phases = [
      { 
          title: goal?.goal_type === 'muscle_gain' ? 'Hypertrophy Block' : 'Base Conditioning',
          desc: `Weeks 1-${chunkSize}: High volume foundation.`,
          progress: calculatePhaseProgress(1, chunkSize)
      },
      { 
          title: goal?.goal_type === 'muscle_gain' ? 'Strength Phase' : 'Intensity & Deficit',
          desc: `Weeks ${chunkSize+1}-${chunkSize*2}: Pushing limits & adjusting.`,
          progress: calculatePhaseProgress(chunkSize+1, chunkSize*2)
      },
      { 
          title: goal?.goal_type === 'muscle_gain' ? 'Peak Week' : 'Sculpt & Maintain',
          desc: `Weeks ${chunkSize*2+1}-${totalDurationWeeks}: Finalizing results.`,
          progress: calculatePhaseProgress(chunkSize*2+1, totalDurationWeeks)
      }
  ];

  const totalPossibleTasks = totalDurationWeeks * 3;
  const completedTasks = microGoals.filter(g => g.done).length;
  const overallProgress = totalPossibleTasks > 0 ? Math.round((completedTasks / totalPossibleTasks) * 100) : 0;

  if (loading) return <Layout><div className="p-10 text-center">Loading your journey...</div></Layout>;

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#f9fafb]">
        <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
          
          <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Manage Goals
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Set clear objectives and track your journey to a better you.
              </p>
            </div>
            {!isEditingGoal && goal && (
              <button onClick={handleResetGoal} className="bg-white border border-slate-200 text-red-500 font-bold py-2 px-4 rounded-lg hover:bg-slate-50 transition-all text-sm flex items-center gap-2 shadow-sm">
                <Icon name="restart_alt" className="text-base" /> Reset Goal
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── LEFT COLUMN: GOAL FORM & WEEKLY MICRO GOALS ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Primary Goal Card */}
              <section className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                {isEditingGoal ? (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-6">
                      <Icon name="tune" className="text-primary text-2xl" />
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Setup Your Journey</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Journey Title</label>
                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm" placeholder="e.g. Summer Shred" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Goal Type</label>
                        <select value={formData.goal_type} onChange={e => setFormData({...formData, goal_type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm">
                          <option value="fat_loss">Fat Loss</option>
                          <option value="muscle_gain">Muscle Gain</option>
                          <option value="endurance">Endurance / Stamina</option>
                          <option value="maintain">Maintain Weight</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Weeks)</label>
                        <input type="number" min={1} max={52} value={formData.duration_weeks} onChange={e => setFormData({...formData, duration_weeks: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Workout Days / Week</label>
                        <input type="number" min={1} max={7} value={formData.commitment_days_per_week} onChange={e => setFormData({...formData, commitment_days_per_week: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm" />
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivation (Why are you doing this?)</label>
                      <textarea value={formData.motivation} onChange={e => setFormData({...formData, motivation: e.target.value})} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm resize-none" placeholder="I want to feel stronger..." />
                    </div>
                    <div className="flex gap-3 justify-end">
                      {goal && <button onClick={() => setIsEditingGoal(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50">Cancel</button>}
                      <button onClick={handleSaveGoal} className="px-6 py-2.5 bg-primary text-slate-900 rounded-lg text-sm font-bold hover:brightness-110 shadow-sm">Save Goal</button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#eef9f2] dark:bg-primary/20 p-3 rounded-xl text-primary">
                            <Icon name="emoji_events" className="text-2xl" />
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{goal?.title}</h2>
                          <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">{mapGoalTypeToDisplay(goal?.goal_type)}</p>
                        </div>
                      </div>
                      <button onClick={() => setIsEditingGoal(true)} className="text-slate-400 hover:text-primary"><Icon name="edit" /></button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Duration</p>
                        <p className="text-slate-900 dark:text-white font-bold">{goal?.duration_weeks} Weeks Program</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Commitment</p>
                        <p className="text-slate-900 dark:text-white font-bold">{goal?.commitment_days_per_week} Days/Wk</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Status</p>
                        <p className="text-primary font-bold capitalize">{goal?.status || 'Active'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Overall Progress</p>
                        <p className="text-slate-900 dark:text-white font-bold">{overallProgress}%</p>
                      </div>
                    </div>

                    {/* Bảng Motivation Chuẩn UI cũ */}
                    {goal?.motivation && (
                      <div className="bg-[#eafaf1] dark:bg-primary/10 border border-[#d1f2df] dark:border-primary/20 rounded-xl p-5 mt-6">
                        <div className="flex items-start gap-3">
                          <Icon name="psychology" className="text-primary mt-0.5 text-xl" />
                          <div className="w-full">
                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Motivation</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{goal.motivation}"</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* WEEKLY MICRO GOALS LIST (Auto-Generated Details) */}
              {!isEditingGoal && (
                <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Icon name="checklist" className="text-primary"/> Micro-Goals (Action Plan)
                    </h2>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                       {completedTasks}/{totalPossibleTasks} Completed
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {Array.from({ length: totalDurationWeeks }).map((_, i) => {
                      const weekNum = i + 1;
                      const predefinedTasks = getPredefinedTasks(goal.goal_type, weekNum, chunkSize);
                      
                      // Kiểm tra xem task này đã được tick chưa trong DB
                      const tasksWithStatus = predefinedTasks.map(label => {
                          const dbRecord = microGoals.find(g => g.week === weekNum && g.label === label);
                          return { label, done: dbRecord ? dbRecord.done : false };
                      });

                      const weekDoneCount = tasksWithStatus.filter(t => t.done).length;
                      const weekProgress = Math.round((weekDoneCount / predefinedTasks.length) * 100);
                      const isExpanded = expandedWeek === weekNum;

                      return (
                        <div key={weekNum} className={`border rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-primary/50 shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                          
                          <button 
                            onClick={() => setExpandedWeek(isExpanded ? 0 : weekNum)}
                            className={`w-full flex justify-between items-center p-4 transition-colors ${isExpanded ? 'bg-primary/5' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                          >
                            <div className="flex items-center gap-4">
                                <span className={`font-bold ${isExpanded ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Week {weekNum}</span>
                                <span className="text-xs text-slate-500 font-medium">{weekDoneCount}/{predefinedTasks.length} Done</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{width: `${weekProgress}%`}}/>
                                </div>
                                <Icon name={isExpanded ? "expand_less" : "expand_more"} className="text-slate-400"/>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                              <div className="space-y-1">
                                {tasksWithStatus.map((task, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                                      <input 
                                        type="checkbox" 
                                        checked={task.done} 
                                        onChange={() => handleToggleTask(weekNum, task.label)} 
                                        className="form-checkbox rounded text-primary h-5 w-5 cursor-pointer border-slate-300" 
                                      />
                                      <span className={`text-sm transition-all ${task.done ? "line-through text-slate-400" : "text-slate-700 dark:text-white font-medium"}`}>{task.label}</span>
                                    </label>
                                  </div>
                                ))}
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

            {/* ── RIGHT COLUMN: ROADMAP ── */}
            <div className="flex flex-col gap-6">
              
              {/* GRADUAL PROGRESS ROADMAP */}
              <section className="bg-[#111827] text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                      <Icon name="timeline" className="text-primary" />
                      <h2 className="text-lg font-bold">Goal Roadmap</h2>
                  </div>
                  <span className="text-xl font-black text-primary">{overallProgress}%</span>
                </div>

                <div className="relative pl-6 space-y-8">
                  {phases.map((phase, index) => {
                    const isCompleted = phase.progress === 100;
                    const isActive = phase.progress > 0 && phase.progress < 100;
                    
                    const colorClass = isCompleted ? 'text-primary' : isActive ? 'text-primary' : 'text-slate-500';
                    const bgColorClass = isCompleted ? 'bg-primary border-primary' : isActive ? 'bg-slate-800 border-primary' : 'bg-slate-800 border-slate-600';

                    return (
                      <div key={index} className="relative transition-all duration-500">
                        {/* Cột nối timeline (Xám hoặc Xanh) */}
                        {index !== phases.length - 1 && (
                            <div className="absolute left-[-19px] top-6 bottom-[-24px] w-[2px] bg-slate-700">
                                {/* Line tiến độ chạy dần */}
                                <div className="bg-primary w-full transition-all duration-700" style={{ height: `${phase.progress}%` }} />
                            </div>
                        )}

                        {/* Điểm Node */}
                        <div className={`absolute left-[-24px] top-1.5 h-3 w-3 rounded-full border-2 z-10 transition-all duration-500 ${bgColorClass}`} />
                        
                        <div className="pb-2">
                            <div className="flex justify-between items-center mb-1">
                                <p className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 ${colorClass}`}>
                                Phase {index + 1} {isCompleted && <Icon name="check_circle" className="text-[12px]" />}
                                </p>
                                {phase.progress > 0 && !isCompleted && (
                                    <span className="text-[10px] font-bold text-primary">{phase.progress}%</span>
                                )}
                            </div>
                            
                            <h4 className={`text-sm font-bold mb-1 ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>{phase.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{phase.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button onClick={() => setShowRoadmapDetail(true)} className="w-full mt-10 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold text-white transition-all border border-white/10">
                  View Detailed Program
                </button>
              </section>

              {progress && (
                <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                     <Icon name="bolt" className="text-amber-500" /> Today's Summary
                   </h2>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                         <span className="text-xs text-slate-500 font-medium">Workouts Completed</span>
                         <span className="text-sm font-bold">{progress.totalWorkouts || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                         <span className="text-xs text-slate-500 font-medium">Calories Burned</span>
                         <span className="text-sm font-bold text-orange-500">🔥 {progress.totalCalories || 0}</span>
                      </div>
                   </div>
                </section>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* DETAILED ROADMAP MODAL */}
      {showRoadmapDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
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
                <p className="text-sm text-slate-600 dark:text-slate-300">This detailed roadmap breaks down your {totalDurationWeeks}-week journey into actionable weekly phases, tailored exactly to your primary goal.</p>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                {Array.from({ length: totalDurationWeeks }).map((_, i) => {
                  const week = i + 1;
                  const currentPhase = Math.ceil(week / chunkSize);
                  return (
                  <div key={week} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      {week}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group-hover:border-primary/30 transition-colors relative z-10">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Week {week}</h4>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Phase {currentPhase}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2">
                        {getPredefinedTasks(goal?.goal_type, week, chunkSize)[0]} <br/>
                        {getPredefinedTasks(goal?.goal_type, week, chunkSize)[1]}
                      </p>
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