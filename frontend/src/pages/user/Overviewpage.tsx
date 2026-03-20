import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getMyWorkoutLogs, getDailyRoutine } from '../../services/workoutService';

const OverviewPage = () => {
  const navigate = useNavigate();
  type WorkoutLogEntry = {
    date?: string;
    calories_burned?: number;
    duration_minutes?: number;
  };
  type MealPlanResponse = {
    items?: unknown[];
  };

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const displayName = parsedUser?.profile?.full_name || 'User';

  const [todayWeight, setTodayWeight] = useState<string>('');
  const [todayHeight, setTodayHeight] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [entries, setEntries] = useState<
    { date: string; weight: number; height: number; bmi: number }[]
  >([]);
  
  const [weeklyCalories, setWeeklyCalories] = useState<number>(0);
  const [weeklyCaloriesByDay, setWeeklyCaloriesByDay] = useState<number[]>(new Array(7).fill(0));
  const [weeklySessions, setWeeklySessions] = useState<number>(0);
  const [weeklyDuration, setWeeklyDuration] = useState<number>(0);
  const [mealsLogged, setMealsLogged] = useState<number>(0);

  const [upcomingWorkout, setUpcomingWorkout] = useState<any>(null);
  
  // State chứa mảng 3 bữa ăn từ AI
  const [aiMeals, setAiMeals] = useState<any[]>([]);
  const [loadingMeal, setLoadingMeal] = useState(false);

  const todayBmi =
    todayHeight && todayWeight
      ? Number(todayWeight) / Math.pow(Number(todayHeight) / 100, 2)
      : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedHistory = localStorage.getItem('bodyCheckinHistory');
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) setEntries(parsed);
      } catch { }
    }

    let baseHeight: number | undefined;
    let baseWeight: number | undefined;

    const latest = localStorage.getItem('latestBodyCheckin');
    if (latest) {
      try {
        const parsedLatest = JSON.parse(latest);
        if (typeof parsedLatest.height === 'number') baseHeight = parsedLatest.height;
        if (typeof parsedLatest.weight === 'number') baseWeight = parsedLatest.weight;
      } catch { }
    }

    if (baseHeight == null || baseWeight == null) {
      if (parsedUser?.profile) {
        if (typeof parsedUser.profile.height_cm === 'number') baseHeight = parsedUser.profile.height_cm;
        if (typeof parsedUser.profile.weight_kg === 'number') baseWeight = parsedUser.profile.weight_kg;
      }
    }

    if (!todayHeight && typeof baseHeight === 'number') setTodayHeight(String(baseHeight));
    if (!todayWeight && typeof baseWeight === 'number') setTodayWeight(String(baseWeight));
  }, []);

  // Load Weekly Performance
  useEffect(() => {
    const loadWeeklyCalories = async () => {
      try {
        const logs = await getMyWorkoutLogs();
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = day === 0 ? 6 : day - 1;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - diffToMonday);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const byDay = new Array(7).fill(0);
        let sessions = 0;
        let duration = 0;

        (Array.isArray(logs) ? logs : []).forEach((log: WorkoutLogEntry) => {
          const logDate = new Date(log.date || "");
          if (logDate < weekStart || logDate > weekEnd) return;

          const jsDay = logDate.getDay();
          const index = jsDay === 0 ? 6 : jsDay - 1;
          byDay[index] += Number(log.calories_burned) || 0;
          sessions += 1;
          duration += Number(log.duration_minutes) || 0;
        });

        setWeeklyCaloriesByDay(byDay);
        setWeeklyCalories(byDay.reduce((sum, value) => sum + value, 0));
        setWeeklySessions(sessions);
        setWeeklyDuration(duration);
      } catch (error) {
        console.error(error);
      }
    };
    loadWeeklyCalories();
  }, []);

  useEffect(() => {
    const loadTodayMeals = async () => {
      try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`http://localhost:8000/api/meal-plans/${today}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setMealsLogged(0); return; }
        const data: MealPlanResponse = await res.json();
        setMealsLogged(Array.isArray(data.items) ? data.items.length : 0);
      } catch (error) { setMealsLogged(0); }
    };
    loadTodayMeals();
  }, []);

  // Lấy dữ liệu Upcoming Workout
  useEffect(() => {
    const loadUpcomingWorkout = async () => {
      try {
        const data = await getDailyRoutine();
        const today = new Date().toISOString().split("T")[0];
        if (data[today] && data[today].length > 0) {
            setUpcomingWorkout(data[today][0]);
        }
      } catch (error) {}
    };
    loadUpcomingWorkout();
  }, []);

  // Lấy AI Suggested Meal (Chỉ load 1 lần/ngày và Cache lại)
  const fetchAiMeals = async (forceRefresh = false) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const cacheKey = 'hm_ai_meals_cache';
      
      // Nếu không bắt buộc refresh, thử lấy từ cache trước
      if (!forceRefresh) {
          const cachedStr = localStorage.getItem(cacheKey);
          if (cachedStr) {
              const cachedData = JSON.parse(cachedStr);
              if (cachedData.date === todayStr) {
                  setAiMeals(cachedData.meals);
                  return; // Kết thúc, không gọi API nữa
              }
          }
      }

      setLoadingMeal(true);
      try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:8000/api/meal-plans/ai/recommend', {
             headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          
          // Lọc lấy 3 bữa: Breakfast, Lunch, Dinner
          const formattedMeals = [
              { type: 'Breakfast', icon: '🌅', ...data.breakfast?.[0] },
              { type: 'Lunch', icon: '☀️', ...data.lunch?.[0] },
              { type: 'Dinner', icon: '🌙', ...data.dinner?.[0] }
          ].filter(m => m._id); // Chỉ giữ lại các món có data thực

          setAiMeals(formattedMeals);
          
          // Lưu Cache lại cho ngày hôm nay
          localStorage.setItem(cacheKey, JSON.stringify({
              date: todayStr,
              meals: formattedMeals
          }));

      } catch (e) {
          console.error(e);
      } finally {
          setLoadingMeal(false);
      }
  };

  useEffect(() => {
      fetchAiMeals();
  }, []);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!todayWeight || !todayHeight) { setFormError('Please enter both weight and height.'); return; }
    const weight = Number(todayWeight);
    const height = Number(todayHeight);
    if (weight <= 0 || height <= 0) { setFormError('Values must be greater than 0.'); return; }

    const bmi = weight / Math.pow(height / 100, 2);
    const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const latestEntry = { date: dateLabel, weight, height, bmi: Number(bmi.toFixed(1)) };

    setEntries((prev) => {
      const next = [latestEntry, ...prev];
      localStorage.setItem('bodyCheckinHistory', JSON.stringify(next));
      localStorage.setItem('latestBodyCheckin', JSON.stringify(latestEntry));
      return next;
    });
    setTodayWeight(String(weight)); setTodayHeight(String(height)); setFormError(null);
  };

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const maxWeeklyCalories = Math.max(...weeklyCaloriesByDay, 1);
  const WEEKLY_CALORIE_GOAL = 3500;
  const goalProgress = Math.min(100, Math.round((weeklyCalories / WEEKLY_CALORIE_GOAL) * 100));

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <main className="flex-1 px-8 py-10 max-w-[1400px] mx-auto w-full">

          {/* Personalized Greeting */}
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return `Good morning, ${displayName}!`;
                if (hour < 18) return `Good afternoon, ${displayName}!`;
                return `Good evening, ${displayName}!`;
              })()}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              You have completed <span className="text-primary font-bold">{goalProgress}%</span> of your weekly calorie goal.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">fitness_center</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">Workouts</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{weeklySessions}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">this week</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">Total Time</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{weeklyDuration.toLocaleString()}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">mins</span>
              </div>
               <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(Math.round((weeklyDuration / 300) * 100), 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">local_fire_department</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">Calories Burned</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{weeklyCalories.toLocaleString()}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">kcal</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
                 <span>Goal: {WEEKLY_CALORIE_GOAL.toLocaleString()} kcal</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">Meals Logged</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{mealsLogged}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">today</span>
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
                            No Schedule Today
                          </div>
                          <h3 className="text-2xl font-bold mb-4">You have no workouts planned for today!</h3>
                          <button onClick={() => navigate('/workouts')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-all">
                              Go to My Workouts
                          </button>
                      </>
                  )}
                </div>
              </div>

              {/* Daily Body Metrics Form */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">monitor_heart</span>
                    Daily Body Check-in
                  </h3>
                </div>

                <form onSubmit={handleAddEntry} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                        Weight (kg)
                      </label>
                      <input type="number" min={10} max={300} step="0.1" value={todayWeight} onChange={(e) => setTodayWeight(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="e.g. 70" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                        Height (cm)
                      </label>
                      <input type="number" min={50} max={250} value={todayHeight} onChange={(e) => setTodayHeight(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="e.g. 170" required />
                    </div>
                  </div>
                  {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Today's BMI</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{todayBmi ? todayBmi.toFixed(1) : '—'}</p>
                    </div>
                    <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-slate-900 shadow-md shadow-primary/30 hover:bg-primary/90 transition-all">
                      <span className="material-symbols-outlined text-sm">check_circle</span> Save Today
                    </button>
                  </div>
                </form>

                {entries.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent History</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {entries.map((entry, idx) => (
                        <div key={`${entry.date}-${idx}`} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{entry.date}</p>
                            <p className="text-slate-500">{entry.weight} kg • {entry.height} cm</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">BMI</p>
                            <p className="font-bold text-slate-900 dark:text-white">{entry.bmi.toFixed(1)}</p>
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
              {/* AI Suggested Meals - Cached 3 Meals */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">auto_awesome</span>
                      AI Suggested Meals
                    </h3>
                    <button onClick={() => fetchAiMeals(true)} className={`text-slate-400 hover:text-primary transition-colors ${loadingMeal ? 'animate-spin text-primary' : ''}`}>
                      <span className="material-symbols-outlined">refresh</span>
                    </button>
                  </div>
                  
                  {aiMeals.length > 0 ? (
                      <div className="space-y-4">
                        {aiMeals.map((meal, idx) => {
                          // Ước tính protein: ~30% lượng calo chia cho 4 (1g protein = 4 calo)
                          const estProtein = meal.calories ? Math.round((meal.calories * 0.3) / 4) : 0;
                          return (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                                            {meal.icon} {meal.type}
                                        </span>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{meal.name}</h4>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-xs font-semibold mt-2">
                                    <span className="text-orange-500">🔥 {meal.calories} kcal</span>
                                    <span className="text-blue-500">🥩 ~{estProtein}g Protein</span>
                                    <span className="text-slate-500">⚖️ {meal.quantity}g</span>
                                </div>
                            </div>
                          )
                        })}
                        <button onClick={() => navigate('/meal-planner')} className="w-full bg-primary/10 hover:bg-primary hover:text-slate-900 text-primary font-bold py-2.5 rounded-xl transition-all text-sm mt-2">
                            View in Meal Planner
                        </button>
                      </div>
                  ) : (
                      <div className="text-center py-10">
                          <p className="text-slate-500 text-sm">No suggestions yet. Click refresh to load.</p>
                      </div>
                  )}
                </div>
              </div>

              {/* Weekly Performance */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary">bar_chart</span>
                      Weekly Performance
                  </h3>
                </div>
                <div className="h-40 flex items-end justify-between gap-2 px-2">
                  {weeklyCaloriesByDay.map((calories, index) => {
                    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const heightPercent = maxWeeklyCalories > 0 ? Math.max(5, Math.round((calories / maxWeeklyCalories) * 100)) : 5;
                    const tooltip = `${dayLabels[index]}: ${Math.round(calories).toLocaleString()} kcal`;
                    const isToday = index === todayIndex;
                    
                    return (
                    <div key={dayLabels[index]} className={`w-full ${isToday ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'} rounded-t-lg group relative cursor-pointer transition-colors`} style={{ height: `${heightPercent}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {tooltip}
                      </div>
                    </div>
                  )})}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
                    <span key={`${label}-${index}`} className={index === todayIndex ? 'text-primary' : ''}>
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