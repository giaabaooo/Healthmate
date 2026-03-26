import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import SchedulePlanner from "./SchedulePlanner";

// --- UI helper types/components borrowed from WorkoutUser.tsx ---

type DbWorkout = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  cover_image?: string;
  category?: string;
  category_id?: { _id?: string; name?: string } | string;
  level?: string;
  difficulty?: string;
  calories_burned?: number;
  calories?: number;
  duration?: number;
};

interface RecommendCardProps {
  image: string;
  badge: string;
  name: string;
  tags: string[];
  workout: Workout;
  onAdd: (w: Workout) => void;
}

const RecommendCard = ({ image, badge, name, tags, workout, onAdd }: RecommendCardProps) => (
  <div className="flex-shrink-0 w-72 group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
    <div className="aspect-video w-full overflow-hidden bg-slate-200 relative">
      <img className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" src={image} alt={name} />
      <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-slate-900 text-[10px] font-bold rounded">{badge}</div>
      {(workout as any).isYoutube && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-red-600 text-5xl bg-white/80 rounded-full drop-shadow-lg">play_circle</span>
          </div>
      )}
    </div>
    <div className="flex flex-col p-4 gap-2">
      <h4 className="font-bold text-base line-clamp-1">{name}</h4>

      <div className="flex gap-2 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase"
          >
            {tag}
          </span>
        ))}
      </div>

      <button
        onClick={() => onAdd(workout)}
        className="mt-2 w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-90"
      >
        Lên Lịch Tập
      </button>
    </div>
  </div>
);

// --- end UI helpers ---

import {
  getWorkoutLibrary,
  getMyWorkoutPlan,
  removeWorkoutPlan,
  getMyWorkoutLogs,
  getDailyRoutine,
  updateDailyRoutine,
  getAIWorkoutRecommend
} from "../../services/workoutService";
import { createWorkoutLog } from "../../services/workoutLogService";
import { getUserGoal } from "../../services/goalService";

interface Workout {
  _id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: number;
  estimatedCalories: number;
  video_url?: string;
  cover_image?: string;
  title: string;
  exercises?: {
    title: string;
    video_url?: string;
    duration_sec?: number;
  }[];
}

interface TodaysExercise {
  id: string;
  name: string;
  workout_id?: string;
  startTime: string;
  endTime: string;
  image: string;
  duration: number;
  calories: number;
  video_url?: string;
  exercises?: {
    title: string
    video_url?: string
    duration_sec?: number
  }[]
}

const getBmiRange = (bmi: number) => {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
};

const getEmbedUrl = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
};

// Hàm định dạng ngày tháng khắc phục lỗi Invalid Date và lệch múi giờ
const getLocalDateString = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dateNum = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateNum}`;
};

const WorkoutsUserPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;
  const [library, setLibrary] = useState<Workout[]>([]);
  const [myPlan, setMyPlan] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [workoutSearch, setWorkoutSearch] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  
  const [aiRecommendations, setAiRecommendations] = useState<Workout[]>([]);
  const [goal, setGoal] = useState<any>(null);

  const [previewWorkoutId, setPreviewWorkoutId] = useState<string | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<Workout | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [dailyCaloTarget, setDailyCaloTarget] = useState(0);
  const [dailyCaloBurned, setDailyCaloBurned] = useState(0);
  const [dailyProgressPercent, setDailyProgressPercent] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  // States cho việc Add vào Routine
  const [addStartTime, setAddStartTime] = useState("08:00");
  const [addEndTime, setAddEndTime] = useState("08:30");
  // STATE MỚI: Lựa chọn kiểu lặp lại lịch tập
  const [recurrence, setRecurrence] = useState<'none' | 'daily_week' | '246_week' | '357_week'>('none');

  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [finishingWorkout, setFinishingWorkout] = useState(false);

  const todayStrLocal = getLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStrLocal);
  const [exercisesByDate, setExercisesByDate] = useState<Record<string, TodaysExercise[]>>({});
  const [eventsByDate, setEventsByDate] = useState<Record<string, { title: string; time: string; image?: string }[]>>({});
  const todaysExercises = exercisesByDate[selectedDate] || [];

  // ... (Giữ nguyên các hàm load dữ liệu, tính toán BMI, Goal) ...
  useEffect(() => {
    if (library.length === 0) return;
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const w = user?.profile?.weight_kg;
    const h = user?.profile?.height_cm;
    
    let range = 'unknown';
    if (w && h) {
        const bmi = Number((w / ((h / 100) ** 2)).toFixed(1));
        range = getBmiRange(bmi);
    }

    const userId = user?._id || 'guest';
    const cacheKey = `ai_recs_v5_${userId}`; 

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.bmiRange === range && parsed.data && parsed.data.length > 0) {
                setAiRecommendations(parsed.data);
                return; 
            }
        } catch(e) { console.error("Cache read error", e); }
    }

    const loadAI = async () => {
      try {
        const rec = await getAIWorkoutRecommend(goal, logs, library);
        if (rec && rec.length > 0) {
            setAiRecommendations(rec);
            localStorage.setItem(cacheKey, JSON.stringify({ bmiRange: range, data: rec }));
        }
      } catch (err) {
        console.error("AI recommend error", err);
      }
    };
    
    loadAI();
  }, [goal, library, logs]);

  const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
    if (gender === 'male') return 10 * weight + 6.25 * height - 5 * age + 5;
    return 10 * weight + 6.25 * height - 5 * age - 161;
  };

  const calculateDailyCaloTarget = () => {
    if (!goal?.profile) return 0;
    const { weight_kg, height_cm, birth_date, gender } = goal.profile;
    if (!weight_kg || !height_cm || !birth_date) return 0;

    const age = new Date().getFullYear() - new Date(birth_date).getFullYear();
    const bmr = calculateBMR(weight_kg, height_cm, age, gender || 'male');
    const tdee = bmr * 1.2;

    if (goal.goal_type === 'fat_loss') return tdee - 500;
    if (goal.goal_type === 'muscle_gain') return tdee + 300;
    return tdee;
  };

  const calculateDailyProgress = () => {
    const todayStr = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.date).toDateString() === todayStr);
    const burned = todayLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);

    setDailyCaloBurned(burned);
    const target = calculateDailyCaloTarget();
    setDailyCaloTarget(target);

    const percent = target > 0 ? Math.min((burned / target) * 100, 100) : 0;
    setDailyProgressPercent(percent);

    if (percent >= 100 && !showCongrats) {
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 5000); 
    }
  };

  const loadGoal = async () => {
    try {
      const g = await getUserGoal();
      setGoal(g);
    } catch (err) {}
  };

  useEffect(() => {
    loadGoal();
    loadAll();
  }, []);

  const loadLibrary = async () => {
    try {
      const data = await getWorkoutLibrary();
      setLibrary(data);
      setDbError(null);
    } catch (err: any) {
      setDbError("Không thể tải danh sách bài tập.");
      setLibrary([]);
    }
  };

  const loadPlan = async () => {
    const data = await getMyWorkoutPlan();
    setMyPlan(data);
  };

  const loadLogs = async () => {
    const data = await getMyWorkoutLogs();
    setLogs(data);
  };

  const loadTodaysExercises = async () => {
    try {
      const data = await getDailyRoutine();
      const formatted: Record<string, TodaysExercise[]> = {};

      Object.keys(data).forEach(date => {
        formatted[date] = data[date].map((ex: any, index: number) => ({
          id: ex.workout_id || `${date}-${index}`, 
          name: ex.name,
          startTime: ex.startTime,
          endTime: ex.endTime,
          image: ex.image,
          duration: ex.duration,
          calories: ex.calories
        }));
      });

      setExercisesByDate(formatted);
      const events: any = {};
      Object.keys(formatted).forEach(date => {
        events[date] = formatted[date].map((ex) => ({
          title: ex.name,
          time: `${ex.startTime} - ${ex.endTime}`,
          image: ex.image
        }));
      });
      setEventsByDate(events);
    } catch (error) {}
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadLibrary(), loadPlan(), loadLogs(), loadTodaysExercises()]);
    setLoading(false);
  };

  useEffect(() => {
    calculateDailyProgress();
  }, [logs, goal]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setExerciseTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const filteredDbWorkouts = useMemo(() => {
    const q = workoutSearch.trim().toLowerCase();
    if (!q) return library;
    return library.filter((w) => {
      const title = (w.title || w.name || "").toLowerCase();
      return title.includes(q);
    });
  }, [library, workoutSearch]);

  useEffect(() => {
    if (!previewWorkoutId) {
      setPreviewWorkout(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    if (previewWorkoutId.startsWith('yt-')) {
        const yt = aiRecommendations.find(a => a._id === previewWorkoutId);
        if (yt) {
            setPreviewWorkout(yt);
            return;
        }
    }

    const controller = new AbortController();
    const fetchWorkoutDetail = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const res = await fetch(`https://healthmate.onrender.com/api/workouts/${previewWorkoutId}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) {
          setPreviewWorkout(null);
          setPreviewError(data?.error || "Không thể tải chi tiết bài tập.");
          return;
        }
        setPreviewWorkout(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setPreviewWorkout(null);
        setPreviewError("Có lỗi xảy ra khi kết nối tới server.");
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchWorkoutDetail();
    return () => controller.abort();
  }, [previewWorkoutId, aiRecommendations]);

  const isTimeOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(`1970-01-01T${start1}:00`);
    const e1 = new Date(`1970-01-01T${end1}:00`);
    const s2 = new Date(`1970-01-01T${start2}:00`);
    const e2 = new Date(`1970-01-01T${end2}:00`);
    return s1 < e2 && e1 > s2;
  };

  // HÀM MỚI: Tự động tính toán mảng ngày tương lai dựa trên luật lặp lại
  const generateTargetDates = (startDateStr: string, type: string) => {
    const dates = [];
    const start = new Date(startDateStr);
    
    if (type === 'none') return [startDateStr];

    for (let i = 0; i < 7; i++) {
       const d = new Date(start);
       d.setDate(d.getDate() + i);
       const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
       const dateStr = getLocalDateString(d);

       if (type === 'daily_week') {
           dates.push(dateStr);
       } else if (type === '246_week') {
           if ([1, 3, 5].includes(dayOfWeek)) dates.push(dateStr); // Thứ 2, 4, 6
       } else if (type === '357_week') {
           if ([2, 4, 6].includes(dayOfWeek)) dates.push(dateStr); // Thứ 3, 5, 7
       }
    }
    return dates;
  };

  // CẬP NHẬT HÀM: Thêm vào lịch (Hỗ trợ nhiều ngày)
  const addToRoutine = async (workout: Workout) => {
    if (addStartTime >= addEndTime) {
      alert("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.");
      return;
    }

    const targetDates = generateTargetDates(selectedDate, recurrence);
    let successCount = 0;
    let overlapCount = 0;

    // Clone state hiện tại để thay đổi an toàn
    const newExercisesByDate = { ...exercisesByDate };
    const newEventsByDate = { ...eventsByDate };
    const promises = [];

    for (const targetDate of targetDates) {
        const existingExs = newExercisesByDate[targetDate] || [];

        // Kiểm tra xem giờ này ngày đó có trống không
        const hasOverlap = existingExs.some(ex =>
          isTimeOverlapping(addStartTime, addEndTime, ex.startTime, ex.endTime)
        );

        if (hasOverlap) {
          overlapCount++;
          continue; // Bỏ qua ngày này nếu trùng lịch
        }

        let newExercisesFromWorkout = [];
        if (workout.exercises && workout.exercises.length > 0) {
          newExercisesFromWorkout = workout.exercises.map((ex: any, i: number) => ({
            id: `${workout._id}-${targetDate}-${Date.now()}-${i}`,
            workout_id: workout._id,
            name: ex.title || workout.title || workout.name || "Workout",
            startTime: addStartTime,
            endTime: addEndTime,
            image: workout.cover_image || "https://placehold.co/100x100/png?text=Workout",
            duration: Math.round((ex.duration_sec || 60) / 60),
            calories: Math.round((workout.calories_burned || workout.estimatedCalories || 0) / workout.exercises!.length),
            video_url: ex.video_url
          }));
        } else {
          newExercisesFromWorkout = [{
            id: `${workout._id}-${targetDate}-${Date.now()}`,
            workout_id: workout._id,
            name: workout.title || workout.name || "Workout",
            startTime: addStartTime,
            endTime: addEndTime,
            image: workout.cover_image || "https://placehold.co/100x100/png?text=Workout",
            duration: workout.duration || 30,
            calories: workout.calories_burned || workout.estimatedCalories || 0,
            video_url: workout.video_url
          }];
        }

        const mergedExercises = [...existingExs, ...newExercisesFromWorkout];
        newExercisesByDate[targetDate] = mergedExercises;

        const newEvents = mergedExercises.map(ex => ({
          title: ex.name,
          time: `${ex.startTime} - ${ex.endTime}`,
          image: ex.image
        }));
        newEventsByDate[targetDate] = newEvents;

        // Đẩy request cập nhật backend vào mảng Promise chờ
        promises.push(updateDailyRoutine({ date: targetDate, exercises: mergedExercises }));
        successCount++;
    }

    if (successCount === 0) {
      alert("Không thể thêm lịch. Các khung giờ trong ngày bạn chọn đều đã có bài tập!");
      return;
    }

    // Cập nhật State Frontend ngay lập tức
    setExercisesByDate(newExercisesByDate);
    setEventsByDate(newEventsByDate);

    try {
      // Đợi Backend lưu xong toàn bộ các ngày
      await Promise.all(promises);

      // Thông báo Notification hệ thống
      const newNoti = {
        id: `reminder_${Date.now()}`,
        title: 'Workout Reminder',
        message: `Đã xếp lịch: ${workout.title || workout.name} vào ${successCount} ngày tới lúc ${addStartTime}.`,
        timeLabel: 'Mới',
        unread: true,
        href: '/workouts',
        icon: 'alarm',
        color: 'bg-primary/20 text-primary'
      };
      const existingNotis = JSON.parse(localStorage.getItem('hm_notifications') || '[]');
      localStorage.setItem('hm_notifications', JSON.stringify([newNoti, ...existingNotis]));
      window.dispatchEvent(new Event('notifications-updated')); 

      setPreviewWorkoutId(null);
      
      let msg = `Đã thêm bài tập thành công vào ${successCount} ngày!`;
      if (overlapCount > 0) msg += ` (Hệ thống đã tự động bỏ qua ${overlapCount} ngày do bạn bị trùng giờ)`;
      alert(msg);

    } catch (error) {
      alert("Có lỗi khi lưu lịch lên server.");
    }
  };

  const startWorkoutSession = () => {
    if (todaysExercises.length === 0) {
      alert("Không có bài tập nào. Hãy thêm từ danh sách.");
      return;
    }
    setIsWorkoutActive(true);
    setCurrentExerciseIndex(0);
    setWorkoutStartTime(new Date());
    setExerciseTimer(0);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < todaysExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setExerciseTimer(0);
    } else {
      finishWorkoutSession();
    }
  };

  const finishWorkoutSession = async () => {
    setFinishingWorkout(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const logPromises = todaysExercises.map(exercise => {
        if (exercise.workout_id && !exercise.workout_id.startsWith('yt-')) {
            return createWorkoutLog({
              workout_id: exercise.workout_id,
              duration_minutes: exercise.duration || 30,
              calories_burned: exercise.calories || 0,
              date: todayStr,
              start_time: exercise.startTime,
            }).catch(()=>{});
        }
        return Promise.resolve();
      });

      await Promise.all(logPromises);

      setExercisesByDate(prev => ({ ...prev, [selectedDate]: [] }));
      await updateDailyRoutine({ date: selectedDate, exercises: [] });

      setIsWorkoutActive(false);
      setCurrentExerciseIndex(0);
      setWorkoutStartTime(null);
      setExerciseTimer(0);

      const caloriesBurnedThisSession = todaysExercises.reduce((sum, ex) => sum + (ex.calories || 0), 0);
      setDailyProgressPercent((prev) => {
        const newPercent = Math.min(prev + (caloriesBurnedThisSession / dailyCaloTarget) * 100, 100);
        if (newPercent >= 100) {
          setShowCongrats(true);
          setTimeout(() => setShowCongrats(false), 3000);
        }
        return newPercent;
      });

      await loadLogs();
    } catch (error) {} 
    finally { setFinishingWorkout(false); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const removeFromRoutine = async (index: number) => {
    const newExercises = todaysExercises.filter((_, i) => i !== index);
    setExercisesByDate(prev => ({ ...prev, [selectedDate]: newExercises }));
    await updateDailyRoutine({ date: selectedDate, exercises: newExercises });
  };

  const moveUp = async (index: number) => {
    if (index > 0) {
      const newExercises = [...todaysExercises];
      [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
      setExercisesByDate(prev => ({ ...prev, [selectedDate]: newExercises }));
      try { await updateDailyRoutine({ date: selectedDate, exercises: newExercises }); } catch (error) {}
    }
  };

  const moveDown = async (index: number) => {
    if (index < todaysExercises.length - 1) {
      const newExercises = [...todaysExercises];
      [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
      setExercisesByDate(prev => ({ ...prev, [selectedDate]: newExercises }));
      try { await updateDailyRoutine({ date: selectedDate, exercises: newExercises }); } catch (error) {}
    }
  };

  const getLevelBadgeStyle = (level: string) => {
    if (!level) return "bg-slate-400 text-white";
    const l = level.toLowerCase();
    if (l.includes("beginner")) return "bg-green-500 text-white";
    if (l.includes("intermediate")) return "bg-yellow-500 text-white";
    if (l.includes("advanced")) return "bg-red-500 text-white";
    return "bg-slate-400 text-white";
  };

  const recommendations = useMemo(() => {
    if (!aiRecommendations.length) return [];
    return aiRecommendations.map((w) => ({
      image: w.cover_image || "https://placehold.co/600x400/png?text=Workout",
      badge: (w as any).isYoutube ? "YOUTUBE" : w.level?.toUpperCase() || "AI RECOMMENDED",
      name: w.title,
      tags: [
        typeof w.category_id === "object" ? w.category_id?.name || "General" : ((w as any).category?.name || "General"),
        w.difficulty || w.level || "All",
      ],
      workout: w,
    }));
  }, [aiRecommendations]);

  const scheduleDays = useMemo(() => {
    const todayObj = new Date()
    const days = []
    for (let i = -3; i <= 3; i++) {
      const d = new Date()
      d.setDate(todayObj.getDate() + i)
      days.push({
        fullDateStr: getLocalDateString(d), 
        label: d.toLocaleDateString("en-US", { weekday: "narrow" }).toUpperCase(),
        date: d.getDate()
      })
    }
    return days
  }, [])

  return (
    <Layout>
      <div className="flex flex-col xl:flex-row flex-1 gap-8 items-start w-full">
        {/* ── Main Content ── */}
        <div className="flex flex-col flex-1 gap-8 w-full min-w-0">

          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-slate-900 dark:text-slate-100 text-4xl font-black leading-tight tracking-[-0.033em]">
                My Workout &amp; Schedule
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${dailyProgressPercent === 0 ? 'bg-red-400' :
                          dailyProgressPercent < 25 ? 'bg-orange-400' :
                            dailyProgressPercent < 50 ? 'bg-yellow-400' :
                              dailyProgressPercent < 75 ? 'bg-blue-400' :
                                dailyProgressPercent < 200 ? 'bg-green-400' : 'bg-emerald-500'
                        }`}
                      style={{ width: `${dailyProgressPercent}%` }}
                    />
                    {showCongrats && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-pulse rounded-full" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Daily Progress: {Math.round(dailyProgressPercent)}%
                  </span>
                </div>
                <span className="text-slate-400">|</span>
                <div className="text-xs text-slate-500">
                  Target: 🔥 {Math.round(dailyCaloTarget)} kcal
                </div>
              </div>
            </div>
            <button
              onClick={startWorkoutSession}
              className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-slate-900 text-sm font-bold leading-normal transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-xl">play_circle</span>
              <span className="truncate">Start Workout</span>
            </button>
          </div>

          {/* Today's Routine */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                Routine cho {selectedDate === todayStrLocal ? "Hôm nay" : new Date(selectedDate).toLocaleDateString()}
              </h3>
              <button
                className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                onClick={() => document.getElementById('workout-selection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span className="material-symbols-outlined text-base">add</span> Add Exercise
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {todaysExercises.length === 0 ? (
                <div className="text-slate-500 text-center py-8">Chưa có bài tập nào được lên lịch.</div>
              ) : (
                todaysExercises.map((ex, index) => (
                  <div key={ex.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center justify-center min-w-[60px] py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Ex {index + 1}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">{ex.startTime} - {ex.endTime}</span>
                    </div>
                    <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img alt={ex.name} className="h-full w-full object-cover" src={ex.image} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{ex.name}</h4>
                      <p className="text-sm text-slate-500">{ex.duration} min • 🔥 {ex.calories} kcal</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveUp(index)} className="p-1 text-slate-400 hover:text-primary">
                        <span className="material-symbols-outlined">arrow_upward</span>
                      </button>
                      <button onClick={() => moveDown(index)} className="p-1 text-slate-400 hover:text-primary">
                        <span className="material-symbols-outlined">arrow_downward</span>
                      </button>
                      <button onClick={() => removeFromRoutine(index)} className="p-1 text-slate-400 hover:text-red-500">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* AI Recommendations */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="text-xl font-bold">AI Recommended for You</h3>
              </div>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {recommendations.length === 0 ? (
                  <div className="text-sm text-slate-500">Đang phân tích BMI và lấy đề xuất...</div>
              ) : (
                  recommendations.map((rec, i) => (
                    <RecommendCard
                      key={i}
                      {...rec}
                      workout={rec.workout}
                      onAdd={(w) => setPreviewWorkoutId(w._id)} 
                    />
                  ))
              )}
            </div>
          </section>

          {/* Workout list from Database */}
          <section id="workout-selection" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fitness_center</span>
                <h3 className="text-xl font-bold">Thư viện hệ thống</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    value={workoutSearch}
                    onChange={(e) => setWorkoutSearch(e.target.value)}
                    placeholder="Tìm theo tên / level / category..."
                    className="h-11 w-[320px] max-w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              {loading ? (
                <div className="text-sm text-slate-500 px-2 py-6">Đang tải danh sách...</div>
              ) : filteredDbWorkouts.length === 0 ? (
                <div className="text-sm text-slate-500 px-2 py-6">Không tìm thấy bài tập phù hợp.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredDbWorkouts.slice(0, 9).map((w) => {
                    const title = w.title || w.name || "Workout";
                    const isSelected = selectedWorkoutId === w._id;
                    const img = w.cover_image || "https://placehold.co/600x400/png?text=Workout";
                    const calories = w.estimatedCalories || w.calories_burned;
                    const duration = w.duration;

                    return (
                      <div
                        key={w._id}
                        onClick={() => setPreviewWorkoutId(w._id)}
                        className={`cursor-pointer text-left group rounded-xl border p-4 transition-all hover:shadow-md ${isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-slate-200 dark:border-slate-800 hover:border-primary/40"
                          }`}
                      >
                        {img && (
                          <img
                            src={img}
                            alt={title}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h4 className="font-bold text-lg mb-2 truncate">{title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                          {w.description || "Mô tả bài tập"}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
                            🔥 {calories || 0} kcal
                          </span>
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
                            ⏱ {duration || 0} phút
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Workout History */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Lịch sử tập</h2>
            {logs.length === 0 ? (
              <div className="text-slate-500">Chưa có lịch sử tập luyện</div>
            ) : (
              <>
                {(() => {
                  const sortedLogs = [...logs].sort((a, b) => {
                    const timeA = new Date(`${a.date}T${a.start_time || "00:00"}`);
                    const timeB = new Date(`${b.date}T${b.start_time || "00:00"}`);
                    return timeB.getTime() - timeA.getTime();
                  });

                  const indexOfLast = currentPage * logsPerPage;
                  const indexOfFirst = indexOfLast - logsPerPage;
                  const currentLogs = sortedLogs.slice(indexOfFirst, indexOfLast);
                  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);

                  return (
                    <>
                      <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-200">
                            <tr>
                              <th className="p-3 text-left">Bài tập</th>
                              <th className="p-3 text-left">Thời gian</th>
                              <th className="p-3 text-left">Calories</th>
                              <th className="p-3 text-left">Giờ tập</th>
                              <th className="p-3 text-left">Ngày</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentLogs.map((log) => {
                              const workoutName =
                                log.workout_id?.title ||
                                log.workout_id?.name ||
                                "Workout (Đã Xóa/Youtube)";

                              const formattedTime = log.start_time
                                ? new Date(`1970-01-01T${log.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : "N/A";

                              const formattedDate = new Date(log.date).toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" });

                              return (
                                <tr key={log._id} className="border-t">
                                  <td className="p-3 font-medium truncate max-w-[200px]">{workoutName}</td>
                                  <td className="p-3">{log.duration_minutes} min</td>
                                  <td className="p-3 text-orange-500 font-semibold">
                                    🔥 {log.calories_burned}
                                  </td>
                                  <td className="p-3">{formattedTime}</td>
                                  <td className="p-3">{formattedDate}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-center items-center gap-3 mt-4">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                        >
                          ←
                        </button>
                        <span className="font-medium">
                          Page {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                        >
                          →
                        </button>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* ── Sidebar Component ĐƯỢC LOAD TỪ FILE CON ── */}
        <SchedulePlanner
          days={scheduleDays}
          eventsByDate={eventsByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Detail Modal */}
        {previewWorkoutId && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">fitness_center</span>
                  <h3 className="text-lg font-bold">Thông tin bài tập</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewWorkoutId(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {previewLoading ? (
                <div className="p-6 text-sm text-slate-500 flex-1">Đang tải chi tiết...</div>
              ) : previewError ? (
                <div className="p-6 flex-1">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {previewError}
                  </div>
                </div>
              ) : previewWorkout ? (
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  {(previewWorkout.cover_image || (previewWorkout as any).image) && !(previewWorkout as any).isYoutube && (
                    <img
                      src={previewWorkout.cover_image || (previewWorkout as any).image}
                      alt={previewWorkout.title || previewWorkout.name || "Workout"}
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  )}
                  
                  {/* Nhúng iframe Player cho Youtube */}
                  {(previewWorkout as any).isYoutube && previewWorkout.video_url && (
                    <iframe
                        src={getEmbedUrl(previewWorkout.video_url)}
                        className="w-full h-64 md:h-80 rounded-xl"
                        title={previewWorkout.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                  )}

                  <div className="flex flex-col gap-3">
                    <h4 className="text-xl font-bold">{previewWorkout.title || previewWorkout.name}</h4>
                    <p className="text-slate-600 dark:text-slate-400">{previewWorkout.description}</p>
                    <div className="flex gap-4 flex-wrap">
                      <span className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        🔥 {previewWorkout.calories_burned || previewWorkout.estimatedCalories || 0} kcal
                      </span>
                      <span className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        ⏱ {previewWorkout.duration || 0} phút
                      </span>
                      {(previewWorkout.level || previewWorkout.difficulty) && (
                        <span className={`text-sm px-3 py-1 rounded-full ${getLevelBadgeStyle(previewWorkout.level || previewWorkout.difficulty || "")}`}>
                          {previewWorkout.level || previewWorkout.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-500 flex-1">Không có dữ liệu.</div>
              )}

              {/* KHU VỰC CHỌN GIỜ & LẶP LẠI (RECURRENCE) */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium whitespace-nowrap min-w-[60px]">Hẹn giờ:</label>
                            <input
                                type="time"
                                value={addStartTime}
                                onChange={(e) => setAddStartTime(e.target.value)}
                                className="h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm outline-none focus:border-primary bg-white dark:bg-slate-800"
                            />
                            <span>-</span>
                            <input
                                type="time"
                                value={addEndTime}
                                onChange={(e) => setAddEndTime(e.target.value)}
                                className="h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm outline-none focus:border-primary bg-white dark:bg-slate-800"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium whitespace-nowrap min-w-[60px]">Lặp lại:</label>
                            <select
                                value={recurrence}
                                onChange={(e) => setRecurrence(e.target.value as any)}
                                className="h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm outline-none focus:border-primary bg-white dark:bg-slate-800 w-full"
                            >
                                <option value="none">Chỉ ngày đang chọn</option>
                                <option value="daily_week">Hàng ngày (Trong 7 ngày tới)</option>
                                <option value="246_week">Thứ 2-4-6 (Trong 7 ngày tới)</option>
                                <option value="357_week">Thứ 3-5-7 (Trong 7 ngày tới)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => previewWorkout && addToRoutine(previewWorkout)}
                        className="w-full md:w-auto h-11 px-6 bg-primary text-slate-900 text-sm font-bold rounded-lg hover:brightness-105 shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                        <span className="material-symbols-outlined text-[18px]">calendar_add_on</span> Thêm vào Lịch
                    </button>
                </div>
              </div>

            </div>
          </div>
        )}

      {/* Workout Session Modal */}
      {isWorkoutActive && todaysExercises.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          <div className="w-full h-full bg-black flex flex-col">
            <div className="flex items-center justify-between p-4 bg-black/50 text-white">
              <div className="flex items-center gap-4">
                <button onClick={finishWorkoutSession} disabled={finishingWorkout} className="p-2 hover:bg-white/10 disabled:opacity-50 rounded-full">
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div>
                  <h2 className="text-xl font-bold">Bài tập {currentExerciseIndex + 1}/{todaysExercises.length}</h2>
                  <p className="text-sm opacity-80">{todaysExercises[currentExerciseIndex].name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold">{formatTime(exerciseTimer)}</div>
                <div className="text-sm opacity-80">Thời gian tập</div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-4xl">
                {todaysExercises[currentExerciseIndex].video_url ? (
                  <iframe
                    src={getEmbedUrl(todaysExercises[currentExerciseIndex].video_url!)}
                    className="w-full aspect-video rounded-lg"
                    title={todaysExercises[currentExerciseIndex].name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center text-white">
                    Video Hướng Dẫn Không Có Sẵn
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-black/50">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                  disabled={currentExerciseIndex === 0}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg font-medium"
                >
                  <span className="material-symbols-outlined mr-2">skip_previous</span> Trước
                </button>

                <button
                  onClick={nextExercise}
                  disabled={finishingWorkout}
                  className="px-8 py-3 bg-primary hover:bg-primary/80 disabled:opacity-50 text-slate-900 rounded-lg font-bold"
                >
                  {finishingWorkout ? (
                    <><span className="material-symbols-outlined mr-2 animate-spin">refresh</span> Đang lưu...</>
                  ) : currentExerciseIndex < todaysExercises.length - 1 ? (
                    <><span className="material-symbols-outlined mr-2">skip_next</span> Tiếp theo</>
                  ) : (
                    <><span className="material-symbols-outlined mr-2">check_circle</span> Hoàn thành</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCongrats && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md mx-4 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Chúc mừng!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Bạn đã hoàn thành tốt việc tập luyện ngày hôm nay!</p>
            <div className="text-4xl mb-4">🏆</div>
            <button onClick={() => setShowCongrats(false)} className="bg-primary text-slate-900 px-6 py-2 rounded-lg font-bold hover:opacity-90">
              Tiếp tục
            </button>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default WorkoutsUserPage;