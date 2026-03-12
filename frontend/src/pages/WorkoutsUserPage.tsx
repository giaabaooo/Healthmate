import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
  getWorkoutLibrary,
  addWorkoutPlan,
  getMyWorkoutPlan,
  startWorkout,
  finishWorkout,
  removeWorkoutPlan,
  getMyWorkoutLogs,
} from "../services/workoutService";

import { getUserGoal  } from "../services/goalService";


interface Workout {
  _id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: number;
  estimatedCalories: number;
}

const WorkoutsUserPage = () => {
  const [library, setLibrary] = useState<Workout[]>([]);
  const [myPlan, setMyPlan] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
const [goal, setGoal] = useState<any>(null);
const [goalProgress, setGoalProgress] = useState(0);


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
    const data = await getWorkoutLibrary();
    setLibrary(data);
  };

  const loadPlan = async () => {
    const data = await getMyWorkoutPlan();
    setMyPlan(data);
  };

  const loadLogs = async () => {
    const data = await getMyWorkoutLogs();
    setLogs(data);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadLibrary(), loadPlan(), loadLogs()]);
    setLoading(false);
  };

  useEffect(() => {
  calculateGoalProgress();
}, [logs, goal]);

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

  return (
    <Layout>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">

        <div className="px-10 py-10 max-w-7xl mx-auto flex flex-col gap-12">

          {/* ============================= */}
          {/* HEADER */}
          {/* ============================= */}

          <div>
            <h1 className="text-4xl font-black">
              Workout Center
            </h1>
            <p className="text-slate-500 mt-2">
              Explore workouts and track your fitness journey
            </p>
          </div>

          {/* ============================= */}
          {/* WORKOUT LIBRARY */}
          {/* ============================= */}

          <div>
        {goal && (
  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow">

    <h2 className="text-xl font-bold mb-3">
      Your Goal
    </h2>

    <p className="text-sm text-slate-500 mb-4">
      {goal.title}
    </p>

    <div className="w-full bg-slate-200 rounded-full h-4">

      <div
        className="bg-green-500 h-4 rounded-full transition-all"
        style={{ width: `${Math.min(goalProgress,100)}%` }}
      />

    </div>

    <p className="text-sm mt-2">
      Progress: {Math.round(goalProgress)}%
    </p>

  </div>
)}
            <h2 className="text-2xl font-bold mb-4">
              Workout Library
            </h2>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {library.map((w) => (
                  <div
                    key={w._id}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
                  >

                    <div className="h-40 bg-slate-200 flex items-center justify-center text-sm">
                      Workout
                    </div>

                    <div className="p-5">

                      <div className="flex justify-between items-start">

                        <h3 className="font-bold text-lg">
                          {w.name}
                        </h3>

                        <span
                          className={`text-xs px-2 py-1 rounded-md ${getLevelBadgeStyle(
                            w.difficulty
                          )}`}
                        >
                          {w.difficulty}
                        </span>

                      </div>

                      <p className="text-sm text-slate-500 mt-2">
                        {w.description}
                      </p>

                      <div className="mt-4 flex gap-2 flex-wrap">

                        <span className="text-xs bg-slate-200 px-3 py-1 rounded-full">
                          🔥 {w.estimatedCalories || 0} kcal
                        </span>

                        <span className="text-xs bg-slate-200 px-3 py-1 rounded-full">
                          ⏱ {w.duration} min
                        </span>

                      </div>

                      <button
                        onClick={() => handleAddPlan(w._id)}
                        className="mt-4 w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800"
                      >
                        Add To Plan
                      </button>

                    </div>
                  </div>
                ))}

              </div>
            )}

          </div>

          {/* ============================= */}
          {/* MY WORKOUT PLAN */}
          {/* ============================= */}

          <div>

            <h2 className="text-2xl font-bold mb-4">
              My Workout Plan
            </h2>

            {myPlan.length === 0 ? (
              <div className="text-slate-500">
                You haven't added any workout yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {myPlan.map((item) => (

                  <div
                    key={item._id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow flex justify-between items-center"
                  >

                    <div>

                      <h3 className="font-bold">
                        {item.workout_id?.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        Duration: {item.planned_duration} min
                      </p>

                      <p className="text-xs text-slate-400">
                        Status: {item.status}
                      </p>

                    </div>

                    <div className="flex gap-2">

                      {item.status === "planned" && (
                        <button
                          onClick={() => handleStart(item._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded"
                        >
                          Start
                        </button>
                      )}

                      {item.status === "in_progress" && (
                        <button
                          onClick={() => handleFinish(item._id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded"
                        >
                          Finish
                        </button>
                      )}

                      <button
                        onClick={() => handleRemove(item._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </div>

          {/* ============================= */}
          {/* WORKOUT HISTORY */}
          {/* ============================= */}

          <div>

            <h2 className="text-2xl font-bold mb-4">
              Workout History
            </h2>

            {logs.length === 0 ? (
              <div className="text-slate-500">
                No workout logs yet
              </div>
            ) : (

              <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden">

                <table className="w-full text-sm">

                  <thead className="bg-slate-200">
                    <tr>
                      <th className="p-3 text-left">Workout</th>
                      <th className="p-3 text-left">Duration</th>
                      <th className="p-3 text-left">Calories</th>
                      <th className="p-3 text-left">Date</th>
                    </tr>
                  </thead>

                  <tbody>

                    {logs.map((log) => (
                      <tr
                        key={log._id}
                        className="border-t"
                      >
                        <td className="p-3">
                          {log.workout_id?.name}
                        </td>

                        <td className="p-3">
                          {log.duration_minutes} min
                        </td>

                        <td className="p-3">
                          🔥 {log.calories_burned}
                        </td>

                        <td className="p-3">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>
    </Layout>
  );
};

export default WorkoutsUserPage;