const API_URL = "https://healthmate-y9vt.onrender.com/api/progress";

export const getTodayProgress = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/today`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch today progress");
  }

  return res.json();
};

export const getStreak = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/streak`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const getWeeklyOverview = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/weekly`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};