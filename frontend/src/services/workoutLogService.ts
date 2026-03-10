const API_URL = "http://localhost:8000/api/workout-logs";

export const getMyWorkoutLogs = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};