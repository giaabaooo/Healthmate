import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getDailyRoutine } from '../../services/workoutService';

const OverviewPage = () => {
  const navigate = useNavigate();

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const displayName = parsedUser?.profile?.full_name || 'User';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [todayWeight, setTodayWeight] = useState<string>('');
  const [todayHeight, setTodayHeight] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Dữ liệu hiển thị trong ngày đã chọn
  const [dailyCaloriesIn, setDailyCaloriesIn] = useState<number>(0);
  const [dailyCaloriesBurned, setDailyCaloriesBurned] = useState<number>(0);
  const [dailyWorkoutsCompleted, setDailyWorkoutsCompleted] = useState<number>(0);
  const [dailyDuration, setDailyDuration] = useState<number>(0);
  const [weeklyCaloriesByDay, setWeeklyCaloriesByDay] = useState<number[]>(new Array(7).fill(0));
  const [upcomingWorkout, setUpcomingWorkout] = useState<any>(null);
  
  // Lịch sử Check-in và Nhận xét của AI
  const [entries, setEntries] = useState<{ date: string; weight: number; height: number; bmi: number }[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const todayBmi = todayHeight && todayWeight ? Number(todayWeight) / Math.pow(Number(todayHeight) / 100, 2) : null;

  // Lấy lịch sử Check-in từ LocalStorage
  useEffect(() => {
    const storedHistory = localStorage.getItem('bodyCheckinHistory');
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) setEntries(parsed);
      } catch { }
    }
  }, []);

  // Fetch dữ liệu Calories In, Workouts & Calories Burned dựa trên Ngày đã chọn
  useEffect(() => {
    const loadDailyData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // 1. Lấy dữ liệu Calories In (Từ Meal Plan)
        const mealRes = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mealRes.ok) {
            const mealData = await mealRes.json();
            setDailyCaloriesIn(mealData.total_calories || 0);
        } else {
            setDailyCaloriesIn(0);
        }

        // 2. Lấy dữ liệu Calories Burned & Workouts
        const logRes = await fetch(`http://localhost:8000/api/workout-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (logRes.ok) {
            const logs = await logRes.json();
            
            // Lọc log đúng ngày được chọn
            const dailyLogs = logs.filter((log: any) => log.date && log.date.startsWith(selectedDate));
            setDailyWorkoutsCompleted(dailyLogs.length);
            setDailyDuration(dailyLogs.reduce((sum: number, log: any) => sum + (log.duration_minutes || 0), 0));
            setDailyCaloriesBurned(dailyLogs.reduce((sum: number, log: any) => sum + (log.calories_burned || 0), 0));

            // Tính toán dữ liệu cho Biểu đồ Weekly Performance (Của tuần chứa selectedDate)
            const selectedD = new Date(selectedDate);
            const day = selectedD.getDay();
            const diffToMonday = day === 0 ? 6 : day - 1;
            const weekStart = new Date(selectedD);
            weekStart.setDate(selectedD.getDate() - diffToMonday);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const byDay = new Array(7).fill(0);
            logs.forEach((log: any) => {
              const logDate = new Date(log.date || "");
              if (logDate >= weekStart && logDate <= weekEnd) {
                const jsDay = logDate.getDay();
                const index = jsDay === 0 ? 6 : jsDay - 1;
                byDay[index] += Number(log.calories_burned) || 0;
              }
            });
            setWeeklyCaloriesByDay(byDay);
        }
      } catch (error) { console.error(error); }
    };
    
    loadDailyData();
  }, [selectedDate]);

  // Lấy dữ liệu Upcoming Workout (Dựa trên ngày đã chọn)
  useEffect(() => {
    const loadUpcomingWorkout = async () => {
      try {
        const data = await getDailyRoutine();
        if (data[selectedDate] && data[selectedDate].length > 0) {
            setUpcomingWorkout(data[selectedDate][0]);
        } else {
            setUpcomingWorkout(null);
        }
      } catch (error) {}
    };
    loadUpcomingWorkout();
  }, [selectedDate]);

  // Xử lý khi User cập nhật thông tin body & Gọi AI nhận xét
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!todayWeight || !todayHeight) { setFormError('Vui lòng nhập đủ Cân nặng & Chiều cao.'); return; }
    const weight = Number(todayWeight);
    const height = Number(todayHeight);
    if (weight <= 0 || height <= 0) { setFormError('Chỉ số phải lớn hơn 0.'); return; }

    const bmi = weight / Math.pow(height / 100, 2);
    const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const latestEntry = { date: dateLabel, weight, height, bmi: Number(bmi.toFixed(1)) };

    const oldWeight = entries.length > 0 ? entries[0].weight : weight;

    setEntries((prev) => {
      const next = [latestEntry, ...prev];
      localStorage.setItem('bodyCheckinHistory', JSON.stringify(next));
      return next;
    });

    setIsAnalyzing(true);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/goals/analyze-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ oldWeight, currentWeight: weight })
        });
        if(res.ok) {
            const data = await res.json();
            setAiFeedback(data.feedback);
        }
    } catch(err) {
        console.error("AI Error", err);
    } finally {
        setIsAnalyzing(false);
    }

    setTodayWeight(''); 
    setFormError(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${displayName}!`;
    if (hour < 18) return `Good afternoon, ${displayName}!`;
    return `Good evening, ${displayName}!`;
  };

  const selectedDateIndex = new Date(selectedDate).getDay() === 0 ? 6 : new Date(selectedDate).getDay() - 1;
  const maxWeeklyCalories = Math.max(...weeklyCaloriesByDay, 1);

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <main className="flex-1 px-8 py-10 max-w-[1400px] mx-auto w-full">

          {/* Header & Date Picker */}
          <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {getGreeting()}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                Here's a summary of your activities and progress for this day.
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary ml-2">calendar_month</span>
                <input 
                    type="date" 
                    max={todayStr} 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none text-base font-bold text-slate-700 dark:text-white outline-none cursor-pointer pr-2"
                />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-8xl">fitness_center</span>
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">fitness_center</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">Workouts</p>
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{dailyWorkoutsCompleted}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">sessions</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-8xl">schedule</span>
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">Total Time</p>
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{dailyDuration.toLocaleString()}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">mins</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-8xl">local_fire_department</span>
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">local_fire_department</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">Calories Burned</p>
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-3xl font-black text-orange-500">{dailyCaloriesBurned.toLocaleString()}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">kcal</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-8xl">restaurant</span>
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">Calories In</p>
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-3xl font-black text-cyan-600">{dailyCaloriesIn.toLocaleString()}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">kcal</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              {/* Upcoming Workout */}
              <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 group min-h-[250px] flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-1/2 h-full">
                  <img
                    alt="Next Workout"
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                    src={upcomingWorkout?.image || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900" />
                </div>
                
                <div className="relative z-10 max-w-sm">
                  {upcomingWorkout ? (
                      <>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Up Next
                          </div>
                          <h3 className="text-3xl font-black mb-2">{upcomingWorkout.name}</h3>
                          <p className="text-slate-400 mb-6">
                              Time: {upcomingWorkout.startTime} - {upcomingWorkout.endTime} • Burn ~{upcomingWorkout.calories || 0} kcal
                          </p>
                          <div className="flex gap-4">
                            <button onClick={() => navigate('/workouts')} className="bg-primary text-slate-900 font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all flex items-center gap-2">
                              <span className="material-symbols-outlined">play_arrow</span>
                              Start Workout
                            </button>
                          </div>
                      </>
                  ) : (
                      <>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                            No Schedule
                          </div>
                          <h3 className="text-2xl font-bold mb-4">You have no workouts planned for this date!</h3>
                          <button onClick={() => navigate('/workouts')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-all">
                              Go to My Workouts
                          </button>
                      </>
                  )}
                </div>
              </div>

              {/* Daily Body Metrics Form */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">monitor_heart</span>
                    Update Body Metrics
                  </h3>
                </div>

                <form onSubmit={handleAddEntry} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
                        Current Weight (kg)
                      </label>
                      <input type="number" step="0.1" value={todayWeight} onChange={(e) => setTodayWeight(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center" placeholder="e.g. 70" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
                        Height (cm)
                      </label>
                      <input type="number" step="1" value={todayHeight} onChange={(e) => setTodayHeight(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center" placeholder="e.g. 170" />
                    </div>
                  </div>

                  {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center font-medium">{formError}</p>}

                  <button type="submit" disabled={isAnalyzing} className="w-full flex justify-center items-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-slate-900 shadow-md shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50">
                    {isAnalyzing ? <><span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> AI is analyzing...</> : <><span className="material-symbols-outlined text-[18px]">check_circle</span> Update & Analyze</>}
                  </button>
                </form>

                {/* AI Feedback */}
                {aiFeedback && (
                    <div className="mt-8 bg-[#eefcf3] dark:bg-primary/10 border border-[#bbf0ce] dark:border-primary/20 rounded-2xl p-6 relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-8xl text-primary">auto_awesome</span>
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-[18px]">psychology</span> AI Coach Review
                            </h4>
                            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                                {aiFeedback}
                            </p>
                        </div>
                    </div>
                )}

                {/* History */}
                {entries.length > 0 && (
                  <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-4">Recent Check-in History</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {entries.slice(0, 3).map((entry, idx) => (
                        <div key={`${entry.date}-${idx}`} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-4 py-3">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{entry.date}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{entry.height} cm</p>
                          </div>
                          <div className="text-right flex items-center gap-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Weight</p>
                                <p className="font-bold text-slate-900 dark:text-white text-base">{entry.weight} kg</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">BMI</p>
                                <p className="font-bold text-primary text-base">{entry.bmi.toFixed(1)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              {/* Weekly Performance */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary">bar_chart</span>
                      Weekly Performance
                  </h3>
                </div>
                <div className="h-48 flex items-end justify-between gap-2 px-2">
                  {weeklyCaloriesByDay.map((calories, index) => {
                    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const heightPercent = maxWeeklyCalories > 0 ? Math.max(5, Math.round((calories / maxWeeklyCalories) * 100)) : 5;
                    const tooltip = `${dayLabels[index]}: ${Math.round(calories).toLocaleString()} kcal`;
                    const isSelectedDay = index === selectedDateIndex;
                    
                    return (
                    <div key={dayLabels[index]} className={`w-full ${isSelectedDay ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'} rounded-t-lg group relative cursor-pointer transition-colors`} style={{ height: `${heightPercent}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {tooltip}
                      </div>
                    </div>
                  )})}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
                    <span key={`${label}-${index}`} className={index === selectedDateIndex ? 'text-primary' : ''}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default OverviewPage;