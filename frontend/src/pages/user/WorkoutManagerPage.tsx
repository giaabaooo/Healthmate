import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Workout {
  _id: string;
  name: string;
  category: string;
  description?: string;
}

interface WorkoutLog {
  _id: string;
  workout_id: Workout;
  duration_minutes: number;
  calories_burned: number;
  notes: string;
  date: string;
}

const WorkoutManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding workout logs
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [duration, setDuration] = useState<string>('30');
  const [calories, setCalories] = useState<string>('200');
  const [notes, setNotes] = useState<string>('');

  // Form state for creating new workouts
  const [showCreateWorkout, setShowCreateWorkout] = useState<boolean>(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    category: 'Strength',
    duration: 30,
    calories: 200,
    difficulty: 'Beginner'
  });

  const fetchWorkouts = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/workouts', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkouts(data);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  }, []);

  const fetchWorkoutLogs = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/tracker/workouts?period=week', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkoutLogs(data.workoutLogs || []);
      }
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchWorkouts();
      fetchWorkoutLogs();
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate, fetchWorkouts, fetchWorkoutLogs]);

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWorkout.name || !newWorkout.category) {
      setError('Vui lòng điền tên và category cho workout');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/workouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWorkout)
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form
        setNewWorkout({
          name: '',
          description: '',
          category: 'Strength',
          duration: 30,
          calories: 200,
          difficulty: 'Beginner'
        });
        setShowCreateWorkout(false);
        setError(null);
        
        // Refresh workouts list
        fetchWorkouts();
        
        alert('✅ Workout mới đã được tạo thành công!');
      } else {
        setError(data.message || 'Lỗi khi tạo workout');
      }
    } catch (error) {
      setError('Lỗi kết nối đến server');
    }
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorkout || !duration || !calories) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/tracker/workouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workout_id: selectedWorkout,
          duration_minutes: parseInt(duration),
          calories_burned: parseInt(calories),
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form
        setSelectedWorkout('');
        setDuration('30');
        setCalories('200');
        setNotes('');
        setError(null);
        
        // Refresh workout logs
        fetchWorkoutLogs();
        
        alert('✅ Workout đã được lưu thành công!');
      } else {
        setError(data.message || 'Lỗi khi lưu workout');
      }
    } catch (error) {
      setError('Lỗi kết nối đến server');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Bạn có chắc muốn xóa workout này?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/tracker/workouts/${logId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchWorkoutLogs();
        alert('✅ Workout đã được xóa');
      } else {
        alert('❌ Không thể xóa workout');
      }
    } catch (error) {
      alert('❌ Lỗi kết nối');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">🏋️ Workout Manager</h1>
            <p className="text-slate-600 dark:text-slate-400">Quản lý và theo dõi buổi tập của bạn</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary text-slate-900 rounded-lg hover:opacity-90 font-medium"
          >
            📊 Xem Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Workout Log */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">➕ Thêm Workout Log</h2>
              <button
                onClick={() => setShowCreateWorkout(!showCreateWorkout)}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
              >
                {showCreateWorkout ? '📋 Log Workout' : '➕ Tạo Workout'}
              </button>
            </div>
            
            {showCreateWorkout ? (
              // Create New Workout Form
              <form onSubmit={handleCreateWorkout} className="space-y-4 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">🏋️ Tạo Workout Mới</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tên Workout *
                    </label>
                    <input
                      type="text"
                      value={newWorkout.name}
                      onChange={(e) => setNewWorkout({...newWorkout, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="VD: Push Day"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={newWorkout.category}
                      onChange={(e) => setNewWorkout({...newWorkout, category: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="Strength">Strength</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Flexibility">Flexibility</option>
                      <option value="Recovery">Recovery</option>
                      <option value="Combat">Combat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Mô Tả
                    </label>
                    <textarea
                      value={newWorkout.description}
                      onChange={(e) => setNewWorkout({...newWorkout, description: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="Mô tả về bài tập..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Độ Khó
                    </label>
                    <select
                      value={newWorkout.difficulty}
                      onChange={(e) => setNewWorkout({...newWorkout, difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Thời Gian Mặc Định (phút)
                    </label>
                    <input
                      type="number"
                      value={newWorkout.duration}
                      onChange={(e) => setNewWorkout({...newWorkout, duration: parseInt(e.target.value)})}
                      min="1"
                      max="300"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Calories Mặc Định
                    </label>
                    <input
                      type="number"
                      value={newWorkout.calories}
                      onChange={(e) => setNewWorkout({...newWorkout, calories: parseInt(e.target.value)})}
                      min="1"
                      max="2000"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-opacity"
                >
                  🏋️ Tạo Workout Mới
                </button>
              </form>
            ) : (
              // Add Workout Log Form
              <form onSubmit={handleSaveWorkout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Chọn Bài Tập
                </label>
                <select
                  value={selectedWorkout}
                  onChange={(e) => setSelectedWorkout(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Chọn bài tập --</option>
                  {workouts.map((workout) => (
                    <option key={workout._id} value={workout._id}>
                      {workout.name} ({workout.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Thời Gian (phút)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    max="300"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Calories Đốt
                  </label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    min="1"
                    max="2000"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ghi Chú
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Cảm nhận về buổi tập..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-slate-900 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                💾 Lưu Workout
              </button>
              </form>
            )}
          </div>

          {/* Recent Workout Logs */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">📋 Lịch Sử Gần Đây</h2>
            
            {workoutLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">fitness_center</span>
                <p>Chưa có workout nào</p>
                <p className="text-sm">Hãy thêm workout đầu tiên của bạn!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {workoutLogs.map((log) => (
                  <div key={log._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {log.workout_id.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {log.workout_id.category}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-primary font-medium">⏱️ {log.duration_minutes} phút</span>
                          <span className="text-orange-500 font-medium">🔥 {log.calories_burned} cal</span>
                        </div>
                        {log.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">
                            "{log.notes}"
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(log.date).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Xóa workout"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white dark:bg-background-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">📊 Thống Kê Nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-primary">{workoutLogs.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Workouts</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-orange-500">
                {workoutLogs.reduce((sum, log) => sum + log.calories_burned, 0)}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Calories</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-blue-500">
                {workoutLogs.reduce((sum, log) => sum + log.duration_minutes, 0)}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Minutes</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-green-500">
                {workoutLogs.length > 0 ? Math.round(workoutLogs.reduce((sum, log) => sum + log.calories_burned, 0) / workoutLogs.length) : 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Calories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutManagerPage;
