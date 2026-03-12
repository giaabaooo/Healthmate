const API_URL = "http://localhost:8000/api/workouts";
const USER_WORKOUT_API = "http://localhost:8000/api/user/user-workouts";
const WORKOUT_LOG_API = "http://localhost:8000/api/workout-logs";
export interface Workout {
  _id: string;
  title: string;
  level: string;
  calories_burned: number;
  description: string;
  category_id: {
    _id: string;
    name: string;
  };
}

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
  const res = await fetch("http://localhost:8000/api/workouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create workout");

  return res.json();
};
export const getWorkoutById = async (id: string) => {
  const res = await fetch(`http://localhost:8000/api/workouts/${id}`);
  return res.json();
};
export const updateWorkout = async (id: string, data: any) => {
  const res = await fetch(`http://localhost:8000/api/workouts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteWorkout = async (id: string) => {
  const res = await fetch(`http://localhost:8000/api/workouts/${id}`, {
    method: "DELETE",
  });
  return res.json();
};
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

  const res = await fetch(`${USER_WORKOUT_API}/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};
export const startWorkout = async (id: string) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${USER_WORKOUT_API}/start/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};
export const finishWorkout = async (id: string) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${USER_WORKOUT_API}/finish/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};
export const removeWorkoutPlan = async (id: string) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${USER_WORKOUT_API}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};
export const getMyWorkoutLogs = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${WORKOUT_LOG_API}/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};