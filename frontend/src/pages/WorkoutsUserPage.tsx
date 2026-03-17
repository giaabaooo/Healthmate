import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import SchedulePlanner from "./user/SchedulePlanner";
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

interface ExerciseRowProps {
    set: string;
    time: string;
    image: string;
    name: string;
    muscle: string;
    detail: string;
    isActive?: boolean;
    checked?: boolean;
}

const ExerciseRow = ({ set, time, image, name, muscle, detail, isActive, checked }: ExerciseRowProps) => (
    <div
        className={`flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border group hover:border-primary/50 transition-colors ${isActive
            ? 'border-slate-200 dark:border-slate-800 border-l-4 border-l-primary'
            : 'border-slate-200 dark:border-slate-800'
            }`}
    >
        <div className="flex flex-col items-center justify-center min-w-[60px] py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{set}</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{time}</span>
        </div>
        <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
            <img alt={name} className="h-full w-full object-cover" src={image} />
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">{name}</h4>
            <p className="text-sm text-slate-500">{muscle} • {detail}</p>
        </div>
        <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">edit</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">delete</span>
            </button>
        </div>
        {checked ? (
            <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">check_circle</span>
        ) : (
            <span className="material-symbols-outlined text-slate-300">radio_button_unchecked</span>
        )}
    </div>
);

interface RecommendCardProps {
    image: string;
    badge: string;
    name: string;
    tags: string[];
}

const RecommendCard = ({ image, badge, name, tags }: RecommendCardProps) => (
    <div className="flex-shrink-0 w-72 group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="aspect-video w-full overflow-hidden bg-slate-200 relative">
            <img className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" src={image} alt={name} />
            <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-slate-900 text-[10px] font-bold rounded">{badge}</div>
        </div>
        <div className="flex flex-col p-4 gap-2">
            <h4 className="font-bold text-base">{name}</h4>
            <div className="flex gap-2">
                {tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">{tag}</span>
                ))}
            </div>
            <button className="mt-2 w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-90">
                Add to Routine
            </button>
        </div>
    </div>
);

interface ScheduleDayProps {
    label: string;
    date: number;
    active?: boolean;
    hasDot?: boolean;
}

const ScheduleDay = ({ label, date, active, hasDot }: ScheduleDayProps) => (
    <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
        <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${active
                ? 'bg-primary text-slate-900 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
        >
            {date}
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${hasDot ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
    </div>
);

interface ScheduleEventProps {
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    time: string;
}

const ScheduleEvent = ({ icon, iconBg, iconColor, title, time }: ScheduleEventProps) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center gap-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer">
        <div className={`${iconBg} p-2 rounded-lg ${iconColor}`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="flex-1">
            <h5 className="text-sm font-bold">{title}</h5>
            <p className="text-[10px] text-slate-500">{time}</p>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
    </div>
);

// --- end UI helpers ---

import {
  getWorkoutLibrary,
  addWorkoutPlan,
  getMyWorkoutPlan,
  startWorkout,
  finishWorkout,
  removeWorkoutPlan,
  getMyWorkoutLogs,
  getDailyRoutine,
  updateDailyRoutine,
} from "../services/workoutService";

import { createWorkoutLog } from "../services/workoutLogService";

import { getUserGoal  } from "../services/goalService";


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
   
}

interface TodaysExercise {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  image: string;
  duration: number;
  calories: number;
  
  exercises?: {
    title: string
    video_url?: string
    duration_sec?: number
  }[]
}

const WorkoutsUserPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
const logsPerPage = 5;
  const [library, setLibrary] = useState<Workout[]>([]);
  const [myPlan, setMyPlan] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null); // for workout fetch errors
  const [workoutSearch, setWorkoutSearch] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  // preview modal state
  const [previewWorkoutId, setPreviewWorkoutId] = useState<string | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<Workout | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [goal, setGoal] = useState<any>(null);
  const [goalProgress, setGoalProgress] = useState(0);


  

  // daily progress
  const [dailyCaloTarget, setDailyCaloTarget] = useState(0);
  const [dailyCaloBurned, setDailyCaloBurned] = useState(0);
  const [dailyProgressPercent, setDailyProgressPercent] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  // add to routine modal
  const [addStartTime, setAddStartTime] = useState("08:00");
  const [addEndTime, setAddEndTime] = useState("08:30");

  // workout session state
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [finishingWorkout, setFinishingWorkout] = useState(false);

// schedule planner state
const today = new Date().toISOString().split("T")[0]
const [selectedDate, setSelectedDate] = useState(today)
  const [exercisesByDate, setExercisesByDate] = useState<
Record<string, TodaysExercise[]>
>({})
const [eventsByDate, setEventsByDate] = useState<
Record<string, { title: string; time: string; image?: string }[]>
>({})
const todaysExercises = exercisesByDate[selectedDate] || []
const calculateGoalProgress = () => {
  if (!goal || !logs || logs.length === 0) {
    setGoalProgress(0);
    return;
  }

  let progress = 0;

  if (goal.goal_type === "fat_loss") {
    const totalCalories = logs.reduce(
      (sum, l) => sum + (l.calories_burned || 0)
    );

    progress = Math.min((totalCalories / 2000) * 100, 100);
  }

  if (goal.goal_type === "endurance") {
    const totalMinutes = logs.reduce(
      (sum, l) => sum + (l.duration_minutes || 0)
    );

    progress = Math.min((totalMinutes / 300) * 100, 100);
  }

  if (goal.goal_type === "muscle_gain") {
    progress = Math.min((logs.length / 10) * 100, 100);
  }

  setGoalProgress(progress);
};

const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

const calculateDailyCaloTarget = () => {
  if (!goal?.profile) return 0;

  const { weight_kg, height_cm, birth_date, gender } = goal.profile;
  if (!weight_kg || !height_cm || !birth_date) return 0;

  const age = new Date().getFullYear() - new Date(birth_date).getFullYear();
  const bmr = calculateBMR(weight_kg, height_cm, age, gender || 'male');

  // TDEE = BMR * activity factor (sedentary = 1.2)
  const tdee = bmr * 1.2;

  // Target based on goal
  if (goal.goal_type === 'fat_loss') {
    return tdee - 500; // deficit
  } else if (goal.goal_type === 'muscle_gain') {
    return tdee + 300; // surplus
  } else {
    return tdee; // maintenance
  }
};

const calculateDailyProgress = () => {
  const today = new Date().toDateString();
  const todayLogs = logs.filter(log => new Date(log.date).toDateString() === today);
  const burned = todayLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);

  setDailyCaloBurned(burned);
  const target = calculateDailyCaloTarget();
  setDailyCaloTarget(target);

  const percent = target > 0 ? Math.min((burned / target) * 100, 100) : 0;
  setDailyProgressPercent(percent);

  // Show congrats if completed
  if (percent >= 100 && !showCongrats) {
    setShowCongrats(true);
    setTimeout(() => setShowCongrats(false), 5000); // hide after 5s
  }
};
  // ==========================
  // LOAD DATA
  // ==========================
const loadGoal = async () => {
  try {
    const g = await getUserGoal();
    setGoal(g);
  } catch (err) {
    console.error("Load goal error", err);
  }
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
      console.error("Load library error", err);
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
        id: ex.workout_id || `${date}-${index}`, // fallback id
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

  } catch (error) {
    console.error("Error loading daily routine:", error);
  }
};

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadLibrary(), loadPlan(), loadLogs(), loadTodaysExercises()]);
    setLoading(false);
  };

  useEffect(() => {
  calculateGoalProgress();
  calculateDailyProgress();
}, [logs, goal]);

  // workout session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setExerciseTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // search / filter for workouts
  const filteredDbWorkouts = useMemo(() => {
    const q = workoutSearch.trim();
    if (!q) return library;
    return library.filter((w) => {
      const title = w.title || w.name || "";
      return title.includes(q);
    });
  }, [library, workoutSearch]);

  const selectedWorkout = useMemo(() => {
    if (!selectedWorkoutId) return null;
    return library.find((w) => w._id === selectedWorkoutId) || null;
  }, [library, selectedWorkoutId]);

  // preview workout detail effect
  useEffect(() => {
    if (!previewWorkoutId) {
      setPreviewWorkout(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchWorkoutDetail = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const res = await fetch(`http://localhost:8000/api/workouts/${previewWorkoutId}`, {
          signal: controller.signal,
        });
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

    return () => {
      controller.abort();
    };
  }, [previewWorkoutId]);

  // ==========================
  // ACTIONS
  // ==========================

  const handleAddPlan = async (id: string) => {
    await addWorkoutPlan(id, 30);
    loadPlan();
  };

  const handleStart = async (id: string) => {
    await startWorkout(id);
    loadPlan();
  };

  const handleFinish = async (id: string) => {
    await finishWorkout(id);
    loadPlan();
    loadLogs();
  };

  const isTimeOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(`1970-01-01T${start1}:00`);
    const e1 = new Date(`1970-01-01T${end1}:00`);
    const s2 = new Date(`1970-01-01T${start2}:00`);
    const e2 = new Date(`1970-01-01T${end2}:00`);
    return s1 < e2 && e1 > s2;
  };

  const addToRoutine = async (workout: Workout) => {
    // Validate time
    if (addStartTime >= addEndTime) {
      alert("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.");
      return;
    }

    // Check for time overlap
    const hasOverlap = todaysExercises.some(ex =>
      isTimeOverlapping(addStartTime, addEndTime, ex.startTime, ex.endTime)
    );

    if (hasOverlap) {
      alert("Thời gian tập trùng với bài tập khác. Vui lòng chọn thời gian khác.");
      return;
    }

    const exercises = workout.exercises || [];

const newExercisesFromWorkout = exercises.map((ex: any, i: number) => ({
  id: `${workout._id}-${i}`,
  workout_id: workout._id,
  name: ex.title || workout.title,
  startTime: addStartTime,
  endTime: addEndTime,
  image: workout.cover_image || "https://placehold.co/100x100/png?text=Workout",
  duration: Math.round((ex.duration_sec || 60) / 60),
  calories: Math.round(
    (workout.calories_burned || workout.estimatedCalories || 0) / exercises.length
  ),
  video_url: ex.video_url
}));
 const newExercises = [
  ...(exercisesByDate[selectedDate] || []),
  ...newExercisesFromWorkout
];

setExercisesByDate(prev => ({
  ...prev,
  [selectedDate]: newExercises
}));
await updateDailyRoutine({
  date: selectedDate,
  exercises: newExercises
});
   const newEvents = newExercises.map(ex => ({
  title: ex.name,
  time: `${ex.startTime} - ${ex.endTime}`,
  image: ex.image
}));

setEventsByDate(prev => ({
  ...prev,
  [selectedDate]: newEvents
}));
  // đóng modal sau khi thêm thành công
setPreviewWorkoutId(null);
  alert("Đã thêm bài tập vào lịch trình của bạn!");
  };

  const startWorkoutSession = () => {
    if (todaysExercises.length === 0) {
      alert("Không có bài tập nào trong Today's Routine.");
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
      // Show completion state briefly before finishing
      setTimeout(() => {
        finishWorkoutSession();
      }, 1500); // 1.5 seconds to show 100% progress
    }
  };

  const finishWorkoutSession = async () => {
    setFinishingWorkout(true);
    try {
      // Create logs for all completed exercises
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      console.log("Finishing workout session with exercises:", todaysExercises);

      const logPromises = todaysExercises.map(exercise => {
        console.log("Creating log for exercise:", exercise);
        return createWorkoutLog({
          workout_id: exercise.workout_id,
          duration_minutes: exercise.duration || 30,
          calories_burned: exercise.calories || 0,
          date: today,
          start_time: exercise.startTime,
        }).catch(error => {
          console.error("Error creating workout log for", exercise.name, error);
          // Continue with other logs even if one fails
        });
      });

      const results = await Promise.all(logPromises);
      console.log("Workout logs created:", results);

      // Clear today's exercises
      setExercisesByDate(prev => ({
  ...prev,
  [selectedDate]: []
}));

await updateDailyRoutine({
  date: selectedDate,
  exercises: []
});

      // Reset session state
      setIsWorkoutActive(false);
      setCurrentExerciseIndex(0);
      setWorkoutStartTime(null);
      setExerciseTimer(0);

// Tính calories vừa tập
const caloriesBurnedThisSession = todaysExercises.reduce(
  (sum, ex) => sum + (ex.calories || 0),
  0
);

// cập nhật progress
setDailyProgressPercent((prev) => {
  const newPercent = Math.min(
    prev + (caloriesBurnedThisSession / dailyCaloTarget) * 100,
    100
  );

  if (newPercent >= 100) {
    setShowCongrats(true);
    setTimeout(() => setShowCongrats(false), 3000);
  }

  return newPercent;
});

// Reload logs
await loadLogs();


    } catch (error) {
      console.error("Error finishing workout session:", error);
      setDbError("Failed to save workout logs. Please try again.");
    } finally {
      setFinishingWorkout(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

 const removeFromRoutine = async (index: number) => {

  const newExercises = todaysExercises.filter((_, i) => i !== index);

  setExercisesByDate(prev => ({
    ...prev,
    [selectedDate]: newExercises
  }));

  await updateDailyRoutine({
    date: selectedDate,
    exercises: newExercises
  });
};

  const moveUp = async (index: number) => {
    if (index > 0) {
      const newExercises = [...todaysExercises];
      [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
      setExercisesByDate(prev => ({
  ...prev,
  [selectedDate]: newExercises
}));
      try {
        await updateDailyRoutine({
  date: selectedDate,
  exercises: newExercises
});
      } catch (error) {
        console.error("Error saving daily routine:", error);
      }
    }
  };

  const moveDown = async (index: number) => {
    if (index < todaysExercises.length - 1) {
      const newExercises = [...todaysExercises];
      [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
      setExercisesByDate(prev => ({
  ...prev,
  [selectedDate]: newExercises
}));
      try {
        await updateDailyRoutine({
  date: selectedDate,
  exercises: newExercises
});
      } catch (error) {
        console.error("Error saving daily routine:", error);
      }
    }
  };

  const handleRemove = async (id: string) => {
    await removeWorkoutPlan(id);
    loadPlan();
  };

  // ==========================
  // LEVEL BADGE
  // ==========================

  const getLevelBadgeStyle = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-500 text-white";
      case "Intermediate":
        return "bg-yellow-500 text-white";
      case "Advanced":
        return "bg-red-500 text-white";
      default:
        return "bg-slate-400 text-white";
    }
  };

  // sample UI data used by the new layout

  const recommendations: RecommendCardProps[] = [
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXsVPx7VdS0p_sZivEdM3UANqd9RX9vrmbrufpAUP3NK_NWUrUx1bmWcg3CQR-zPRBf3_BkztMGBSCOvi2vHGuD7eUfgWySlsLpRj4n1CtrCGxiFM-21gSPJ6Z9ElZdZLgh-eEkZA8d_ZOqtQ7-mKnf9i8ZpSLrJeATfthhcmnKEwHStIq1jX534xSVqDznPk2QlHS4wlASewSoM5wATlBd-UiPgbYp5fQKc87d8-6PHEGHsR8jrmlO6FABIgbG-J_S-nvHMuyj0c',
      badge: 'LEVEL UP', name: 'Back Squat', tags: ['Legs', 'Barbell'],
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl0REsQeqGNwFp52PJVX7Wiy9i8Q2SHmHeGbYzOcxIKrW9PIpZAtRClLz8MP61JiW7TV-gDjMyPqFCi_2u-kqX5Z8a6B71ySr5V1OvMaj9fVcQGRPyIZSAsmBVxOVCRHBEhr7Rr0dLCZK61KM5Kfw2JgJwNWiAaLr4zqE_GxJerBse2ijF4JEI9Aibgx2cB2dE4B6r0BSEZbKX5IL4FZlwO8E8Nq6R3We4Ge2-QOcpj0Qs7KCze3NW0AEOPnVC_sBGAUkYTK1mQOc',
      badge: 'RECOVERY', name: 'Classic Push-ups', tags: ['Chest', 'Bodyweight'],
    },
    {
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoVm3WEr02l_-2EF5eaBQZr4Q5p5DV4Kmrd20k0xepK-78NrlvEFqNp05QmYQNytB6Aovqbd5_oVl4qeA7opliK8e-ljIqsDZxvjep3KTOkX7dP2CMzQjQyAGTFN0Yt-DjeSo4lCJGRnHTYS_Dw-qFh-zjrtoadXYG-NdKB16Pl-KZxBs7UOYrFNXLIjmIWJRcFVvPfjEJsA-Q1JeBqj250yNxOWYpDAT_2aI5lDs2taOZK0jzLDnliI3PRPlU5RC1e7Srn4SWVwA',
      badge: 'SCULPT', name: 'Hammer Curls', tags: ['Arms', 'Dumbbells'],
    },
  ];

 

  const scheduleEvents: ScheduleEventProps[] = [
    { icon: 'fitness_center', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', title: 'Chest & Triceps', time: 'Tomorrow • 07:00 AM' },
    { icon: 'directions_run', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500', title: 'HIIT Cardio', time: 'Thu, Oct 27 • 06:30 PM' },
    { icon: 'self_improvement', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500', title: 'Active Recovery', time: 'Sat, Oct 29 • 10:00 AM' },
  ];
  const getEmbedUrl = (url: string) => {
  if (!url) return "";

  if (url.includes("youtu.be")) {
    const id = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("watch?v=")) {
    const id = url.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  return url;
};
const scheduleDays = useMemo(() => {
  const today = new Date()
  const days = []

  for (let i = -3; i <= 3; i++) {
    const d = new Date()
    d.setDate(today.getDate() + i)

    const dateStr = d.toISOString().split("T")[0]

    days.push({
      date: dateStr,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      day: d.getDate()
    })
  }

  return days
}, [])
  return (
    <Layout>
      <div className="flex flex-1 gap-8">
        {/* ── Main Content ── */}
        <div className="flex flex-col flex-1 gap-8">

          {/* Header row (streak/progress + start button) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-slate-900 dark:text-slate-100 text-4xl font-black leading-tight tracking-[-0.033em]">
                My Workout &amp; Schedule
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${
                        dailyProgressPercent === 0 ? 'bg-red-400' :
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
                <span className="text-slate-400">|</span>
                <div className="text-xs text-slate-500">
                  Gợi ý: Tập {Math.ceil(dailyCaloTarget / 300)} bài
                </div>
                <span className="text-slate-400">|</span>
                <span className="text-xs font-bold text-primary flex items-center gap-1"></span>
                  
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

          {/* Today's Routine (static example) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                Today's Routine
               <span className="text-sm font-normal text-slate-500 ml-2">
  {new Date(selectedDate).toDateString()}
</span>
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
                <div className="text-slate-500 text-center py-8">Chưa có bài tập nào trong Today's Routine</div>
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

          {/* Workout list from Database (search/filter) */}
          <section id="workout-selection" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fitness_center</span>
                <h3 className="text-xl font-bold">Chọn bài tập từ hệ thống</h3>
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

            {dbError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {dbError}
              </div>
            )}

            {selectedWorkout && (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="font-semibold">
                    Đã chọn: {selectedWorkout.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWorkoutId(null)}
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              {loading ? (
                <div className="text-sm text-slate-500 px-2 py-6">Đang tải danh sách bài tập...</div>
              ) : filteredDbWorkouts.length === 0 ? (
                <div className="text-sm text-slate-500 px-2 py-6">Không tìm thấy bài tập phù hợp.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredDbWorkouts.slice(0, 9).map((w) => {
                    const title = w.title || w.name || "Workout";
                    const isSelected = selectedWorkoutId === w._id;
                    const img =
                      w.cover_image ||
                      "https://placehold.co/600x400/png?text=Workout";
                    const level = w.difficulty || "";
                    const calories = w.estimatedCalories;
                    const duration = w.duration;
                    const category = w.category || "";

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
                        <h4 className="font-bold text-lg mb-2">{title}</h4>
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
                          {level && (
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getLevelBadgeStyle(level)}`}>
                              {level}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && filteredDbWorkouts.length > 9 && (
                <div className="pt-3 px-1 text-xs text-slate-500">
                  Đang hiển thị 9/{filteredDbWorkouts.length} bài tập. Hãy dùng ô tìm kiếm để lọc thêm.
                </div>
              )}
            </div>
          </section>

          {/* insert original plan/history sections */}
  <div>
  <h2 className="text-2xl font-bold mb-4">Workout History</h2>

  {logs.length === 0 ? (
    <div className="text-slate-500">No workout logs yet</div>
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
                    <th className="p-3 text-left">Workout</th>
                    <th className="p-3 text-left">Duration</th>
                    <th className="p-3 text-left">Calories</th>
                    <th className="p-3 text-left">Time</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {currentLogs.map((log) => {
                    const workoutName =
                      log.workout_id?.title ||
                      log.workout_id?.name ||
                      "Workout";

                    const formattedTime = log.start_time
                      ? new Date(
                          `1970-01-01T${log.start_time}`
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A";

                  const formattedDate = new Date(log.date).toLocaleDateString("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

                    return (
                      <tr key={log._id} className="border-t">
                        <td className="p-3 font-medium">{workoutName}</td>

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

            {/* Pagination */}
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
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



          {/* AI Recommendations */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="text-xl font-bold">AI Recommended for You</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {recommendations.map((rec) => (
                <RecommendCard key={rec.name} {...rec} />
              ))}
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
<SchedulePlanner
  days={scheduleDays}
  eventsByDate={eventsByDate}
  selectedDate={selectedDate}
  onSelectDate={setSelectedDate}
/>

        {/* Mobile FAB */}
        <div className="fixed bottom-6 right-6 xl:hidden flex flex-col gap-3">
          <button className="size-14 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-xl flex items-center justify-center transition-transform active:scale-90">
            <span className="material-symbols-outlined text-2xl">calendar_month</span>
          </button>
          <button className="size-14 bg-primary rounded-full shadow-xl flex items-center justify-center text-slate-900 transition-transform active:scale-90">
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </div>

        {/* Detail Modal */}
        {previewWorkoutId && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">fitness_center</span>
                  <h3 className="text-lg font-bold">Thông tin bài tập</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewWorkoutId(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {previewLoading ? (
                <div className="p-6 text-sm text-slate-500">Đang tải chi tiết...</div>
              ) : previewError ? (
                <div className="p-6">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {previewError}
                  </div>
                </div>
              ) : previewWorkout ? (
                <div className="p-6 space-y-6">
                  {(previewWorkout.cover_image || (previewWorkout as any).image) && (
                    <img
                      src={previewWorkout.cover_image || (previewWorkout as any).image}
                      alt={previewWorkout.title || previewWorkout.name || "Workout"}
                      className="w-full h-64 object-cover rounded-xl"
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
                      {previewWorkout.level && (
                        <span className={`text-sm px-3 py-1 rounded-full ${getLevelBadgeStyle(previewWorkout.level)}`}>
                          {previewWorkout.level}
                        </span>
                      )}
                      {(previewWorkout as any).exercises && (
                        <span className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                          📋 {(previewWorkout as any).exercises.length} bài tập
                        </span>
                      )}
                    </div>
                    {(previewWorkout as any).exercises && (previewWorkout as any).exercises.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-bold mb-2">Danh sách bài tập:</h5>
                        <div className="space-y-4">
                          {(previewWorkout as any).exercises.map((ex: any, index: number) => (
                            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium">{index + 1}.</span>
                                <span className="text-sm font-semibold">{ex.title}</span>
                                {ex.duration_sec && (
                                  <span className="text-xs text-slate-500 ml-auto">⏱ {Math.round(ex.duration_sec / 60)} phút</span>
                                )}
                              </div>
                              {ex.video_url && (
  <iframe
    src={getEmbedUrl(ex.video_url)}
    className="w-full h-64 rounded-lg"
    title={ex.title}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-500">Không có dữ liệu.</div>
              )}

              <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Thời gian:</label>
                  <input
                    type="time"
                    value={addStartTime}
                    onChange={(e) => setAddStartTime(e.target.value)}
                    className="h-8 px-2 rounded border border-slate-200 dark:border-slate-800 text-sm"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={addEndTime}
                    onChange={(e) => setAddEndTime(e.target.value)}
                    className="h-8 px-2 rounded border border-slate-200 dark:border-slate-800 text-sm"
                  />
                  <button
                    onClick={() => previewWorkout && addToRoutine(previewWorkout)}
                    className="h-8 px-3 bg-primary text-slate-900 text-sm font-bold rounded hover:opacity-90"
                  >
                    Thêm vào Today's Routine
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Already showing details in modal
                    }}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Xem chi tiết bài tập
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewWorkoutId(null)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workout Session Modal */}
      {isWorkoutActive && todaysExercises.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          <div className="w-full h-full bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 text-white">
              <div className="flex items-center gap-4">
                <button
                  onClick={finishWorkoutSession}
                  disabled={finishingWorkout}
                  className="p-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div>
                  <h2 className="text-xl font-bold">
                    Bài tập {currentExerciseIndex + 1}/{todaysExercises.length}
                  </h2>
                  <p className="text-sm opacity-80">
                    {todaysExercises[currentExerciseIndex].name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold">
                  {formatTime(exerciseTimer)}
                </div>
                <div className="text-sm opacity-80">
                  Thời gian tập
                </div>
              </div>
            </div>

            {/* Video/Content */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-4xl">
                {/* Placeholder for video - in real app, fetch video from workout */}
               {todaysExercises[currentExerciseIndex].video_url ? (
  <iframe
    src={getEmbedUrl(todaysExercises[currentExerciseIndex].video_url)}
    className="w-full aspect-video rounded-lg"
    title={todaysExercises[currentExerciseIndex].name}
    frameBorder="0"
    allowFullScreen
  />
) : (
  <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center text-white">
    No video available
  </div>
)}
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 bg-black/50">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                  disabled={currentExerciseIndex === 0}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                >
                  <span className="material-symbols-outlined mr-2">skip_previous</span>
                  Trước
                </button>

                <button
                  onClick={nextExercise}
                  disabled={finishingWorkout}
                  className="px-8 py-3 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-lg font-bold"
                >
                  {finishingWorkout ? (
                    <>
                      <span className="material-symbols-outlined mr-2 animate-spin">refresh</span>
                      Đang lưu...
                    </>
                  ) : currentExerciseIndex < todaysExercises.length - 1 ? (
                    <>
                      <span className="material-symbols-outlined mr-2">skip_next</span>
                      Tiếp theo
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined mr-2">check_circle</span>
                      Hoàn thành
                    </>
                  )}
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentExerciseIndex + 1) / todaysExercises.length) * 100}%` }}
                  />
                </div>
                <div className="text-center text-white text-sm mt-2">
                  {currentExerciseIndex + 1} / {todaysExercises.length} bài tập
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Congrats Modal */}
      {showCongrats && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md mx-4 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Chúc mừng!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Bạn đã hoàn thành tốt việc tập luyện ngày hôm nay!
            </p>
            <div className="text-4xl mb-4">🏆</div>
            <button
              onClick={() => setShowCongrats(false)}
              className="bg-primary text-slate-900 px-6 py-2 rounded-lg font-bold hover:opacity-90"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default WorkoutsUserPage;