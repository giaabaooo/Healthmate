const API_URL = "https://healthmate-y9vt.onrender.com/api/workouts";
const USER_WORKOUT_API = "https://healthmate-y9vt.onrender.com/api/user/user-workouts";
const WORKOUT_LOG_API = "https://healthmate-y9vt.onrender.com/api/workout-logs";
const USER_API = "https://healthmate-y9vt.onrender.com/api/users";
//////////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////////

export interface Workout {
  _id: string;
  title: string;
  level: string;
  calories_burned: number;
  description: string;
  cover_image?: string;
  exercises?: {
    title: string;
    video_url: string;
    duration_sec: number;
  }[];
  category_id: {
    _id: string;
    name: string;
  };
}

//////////////////////////////////////////////////////////////
// BASIC WORKOUT APIs
//////////////////////////////////////////////////////////////

export const getWorkouts = async (
  category?: string,
  level?: string,
  search?: string
): Promise<Workout[]> => {
  let query = [];

  if (category) query.push(`category=${category}`);
  if (level) query.push(`level=${level}`);
  if (search) query.push(`search=${search}`);

  const res = await fetch(`${API_URL}?${query.join("&")}`);
  return res.json();
};

export const createWorkout = async (data: any) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create workout");
  return res.json();
};

export const getWorkoutById = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}`);
  return res.json();
};

export const updateWorkout = async (id: string, data: any) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteWorkout = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  return res.json();
};

//////////////////////////////////////////////////////////////
// USER WORKOUT PLAN
//////////////////////////////////////////////////////////////

export const getWorkoutLibrary = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(USER_WORKOUT_API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const addWorkoutPlan = async (
  workout_id: string,
  planned_duration: number = 30
) => {
  const token = localStorage.getItem("token");

  const res = await fetch(USER_WORKOUT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workout_id,
      planned_duration,
    }),
  });

  return res.json();
};

export const getMyWorkoutPlan = async () => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${USER_WORKOUT_API}/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
      return [];
    }

    if (!res.ok) throw new Error(`HTTP error!`);

    return await res.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export const startWorkout = async (id: string) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${USER_WORKOUT_API}/start/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.json();
};

export const finishWorkout = async (id: string) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${USER_WORKOUT_API}/finish/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.json();
};

export const removeWorkoutPlan = async (id: string) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${USER_WORKOUT_API}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.json();
};

//////////////////////////////////////////////////////////////
// WORKOUT LOGS
//////////////////////////////////////////////////////////////

export const getMyWorkoutLogs = async () => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${WORKOUT_LOG_API}/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
      return [];
    }

    if (!res.ok) throw new Error(`HTTP error!`);

    return await res.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

//////////////////////////////////////////////////////////////
// DAILY ROUTINE
//////////////////////////////////////////////////////////////

export const getDailyRoutine = async () => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${USER_API}/me/daily-routine`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`HTTP error!`);

    return await res.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export const updateDailyRoutine = async (data: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${USER_API}/me/daily-routine`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

//////////////////////////////////////////////////////////////
// 🤖 AI RECOMMEND (NEW)
//////////////////////////////////////////////////////////////




export const getAIWorkoutRecommend = async (
  goal: any,
  logs: any[],
  library: Workout[]
) => {
  const token = localStorage.getItem("token");

  const res = await fetch("https://healthmate-y9vt.onrender.com/api/ai/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // 👈 FIX Ở ĐÂY
    },
    body: JSON.stringify({
      goal,
      logs,
      library,
    }),
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return [];
  }

  return res.json();
};