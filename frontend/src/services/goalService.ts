const API_URL = "https://healthmate.onrender.com/api";

const getToken = () => {
  return localStorage.getItem("token");
};

export const getUserGoal = async () => {
  const res = await fetch(`${API_URL}/goals/my-goal`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch goal");
  }

  return res.json();
};

export const getMicroGoals = async (goalId: string) => {

  const res = await fetch(`${API_URL}/micro-goals/${goalId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
};

export const toggleMicroGoal = async (id: string) => {

  const res = await fetch(`${API_URL}/micro-goals/${id}/toggle`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
};

//////////////////////////////////////////////////////////////
// ADD MICRO GOAL
//////////////////////////////////////////////////////////////

export const createMicroGoal = async (goalId: string, label: string) => {

  const res = await fetch(`${API_URL}/micro-goals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      goal_id: goalId,
      label: label,
    }),
  });

  return res.json();
};

//////////////////////////////////////////////////////////////
// DELETE MICRO GOAL
//////////////////////////////////////////////////////////////

export const deleteMicroGoal = async (id: string) => {

  const res = await fetch(`${API_URL}/micro-goals/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
};

//////////////////////////////////////////////////////////////
// UPDATE MOTIVATION
//////////////////////////////////////////////////////////////

export const updateMotivation = async (goalId: string, motivation: string) => {

  const res = await fetch(`${API_URL}/goals/${goalId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      motivation: motivation,
    }),
  });

  return res.json();
};