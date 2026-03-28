const API_URL = "https://healthmate-y9vt.onrender.com/api/workout-logs";

export const createWorkoutLog = async (logData: {
  workout_id: string;
  duration_minutes: number;
  calories_burned: number;
  date: string;
  start_time?: string;
}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(logData),
  });

  if (!res.ok) {
    const text = await res.text();
    const message = `Failed to create workout log (status=${res.status}): ${text}`;
    console.error(message);
    throw new Error(message);
  }

  return res.json();
};

export const getMyWorkoutLogs = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};