import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  today: {
    workoutsCompleted: number;
    caloriesBurned: number;
    duration: number;
    workoutDetails: Array<{
      _id: string;
      workout_id: { name: string; category: string };
      duration_minutes: number;
      calories_burned: number;
      date: string;
    }>;
  };
  week: {
    totalWorkouts: number;
    totalCalories: number;
    totalDuration: number;
    averageCaloriesPerDay: number;
    averageDurationPerDay: number;
  };
  body: {
    currentWeight: number | null;
    lastUpdated: string | null;
    bodyFatPercentage: number | null;
  };
}

interface BodyProgressData {
  bodyProgress: Array<{
    date: string;
    weight_kg: number;
    body_fat_percentage?: number;
  }>;
}

interface WorkoutLogData {
  workoutLogs: Array<{
    date: string;
    calories_burned: number;
    workout_id: { name: string; category: string };
  }>;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bodyProgress, setBodyProgress] = useState<BodyProgressData | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<'calories' | 'weight' | 'muscle'>('calories');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const statsResponse = await fetch('http://localhost:8000/api/tracker/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        console.error('Stats API Error:', errorText);
        throw new Error(`Không thể tải dữ liệu thống kê: ${statsResponse.status} ${errorText}`);
      }

      let statsData;
      try {
        statsData = await statsResponse.json();
      } catch (jsonError) {
        const responseText = await statsResponse.text();
        console.error('JSON parsing error:', responseText);
        throw new Error(`API returned invalid JSON: ${responseText.substring(0, 100)}...`);
      }
      setStats(statsData);

      const bodyResponse = await fetch('http://localhost:8000/api/tracker/body-progress?period=month', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (bodyResponse.ok) {
        const bodyData = await bodyResponse.json();
        setBodyProgress(bodyData);
      }

      const workoutResponse = await fetch('http://localhost:8000/api/tracker/workouts?period=week', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (workoutResponse.ok) {
        const workoutData = await workoutResponse.json();
        setWorkoutLogs(workoutData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (selectedChart === 'calories') {
      if (!workoutLogs?.workoutLogs.length) return [];
      
      const caloriesByDate: { [key: string]: number } = {};
      workoutLogs.workoutLogs.forEach(log => {
        const date = new Date(log.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        caloriesByDate[date] = (caloriesByDate[date] || 0) + log.calories_burned;
      });

      return Object.entries(caloriesByDate).map(([date, calories]) => ({
        date,
        value: calories
      }));
    } else if (selectedChart === 'weight') {
      if (!bodyProgress?.bodyProgress.length) return [];
      
      return bodyProgress.bodyProgress.map(item => ({
        date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        value: item.weight_kg
      }));
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary text-slate-900 rounded-lg hover:opacity-90"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const chartData = formatChartData();
  const maxChartValue = Math.max(...chartData.map(d => d.value), 100);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      <div className="flex h-auto min-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <div className="flex-1 flex flex-col gap-8 p-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Activity & Progress</h1>
              <p className="text-slate-500 dark:text-slate-400">Personal health metrics tracked via AI-sync and manual logs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Calories Burned</p>
                  <span className="material-symbols-outlined text-primary text-sm">local_fire_department</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.week.totalCalories || 0} <span className="text-sm font-normal text-slate-400">kcal</span>
                </p>
                <p className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span> 
                  {stats?.week.averageCaloriesPerDay ? `+${stats.week.averageCaloriesPerDay} avg/day` : 'No data'}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Workouts</p>
                  <span className="material-symbols-outlined text-primary text-sm">fitness_center</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.week.totalWorkouts || 0} <span className="text-sm font-normal text-slate-400">sessions</span>
                </p>
                <p className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span> 
                  {stats?.today.workoutsCompleted ? `${stats.today.workoutsCompleted} today` : 'No workouts today'}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Current Weight</p>
                  <span className="material-symbols-outlined text-primary text-sm">monitor_weight</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.body.currentWeight ? `${stats.body.currentWeight}` : '--'} <span className="text-sm font-normal text-slate-400">kg</span>
                </p>
                <p className="text-primary text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_down</span> 
                  {stats?.body.lastUpdated ? `Updated ${new Date(stats.body.lastUpdated).toLocaleDateString('vi-VN')}` : 'No data'}
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Active Time</p>
                  <span className="material-symbols-outlined text-primary text-sm">timer</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.week.totalDuration || 0} <span className="text-sm font-normal text-slate-400">min</span>
                </p>
                <p className="text-amber-500 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">remove</span> 
                  {stats?.week.averageDurationPerDay ? `${stats.week.averageDurationPerDay} min/day` : 'Steady pace'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance Analytics</h3>
                  <p className="text-sm text-slate-500">
                    {selectedChart === 'calories' ? 'Calories burned across 7 days' : 
                     selectedChart === 'weight' ? 'Weight progress across 30 days' : 
                     'Muscle percentage across time'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedChart('weight')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      selectedChart === 'weight' 
                        ? 'bg-primary text-slate-900' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Weight
                  </button>
                  <button 
                    onClick={() => setSelectedChart('calories')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      selectedChart === 'calories' 
                        ? 'bg-primary text-slate-900' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Calories
                  </button>
                  <button 
                    onClick={() => setSelectedChart('muscle')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      selectedChart === 'muscle' 
                        ? 'bg-primary text-slate-900' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Muscle %
                  </button>
                </div>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      className="uppercase tracking-widest font-bold"
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      domain={[0, maxChartValue * 1.1]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '0.375rem',
                        fontSize: '10px'
                      }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#13ec5b" 
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                    <p>No data available for {selectedChart}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Today's Activities</h3>
                <span className="text-sm text-slate-500">
                  {stats?.today.workoutsCompleted || 0} workouts completed
                </span>
              </div>

              {stats?.today.workoutDetails && stats.today.workoutDetails.length > 0 ? (
                <div className="space-y-3">
                  {stats.today.workoutDetails.map((workout) => (
                    <div key={workout._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">fitness_center</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">{workout.workout_id.name}</h4>
                          <p className="text-sm text-slate-500">{workout.workout_id.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{workout.duration_minutes} min</p>
                        <p className="text-sm font-medium text-primary">{workout.calories_burned} kcal</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">exercise</span>
                  <p>No workouts completed today</p>
                  <p className="text-sm mt-1">Start exercising to track your progress!</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Weekly Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-2xl font-black text-primary">{stats?.week.totalWorkouts || 0}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Total Workouts</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-2xl font-black text-orange-500">{stats?.week.totalCalories || 0}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Total Calories</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-2xl font-black text-blue-500">{stats?.week.totalDuration || 0}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Minutes</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-2xl font-black text-purple-500">{stats?.week.averageCaloriesPerDay || 0}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Daily Average</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
