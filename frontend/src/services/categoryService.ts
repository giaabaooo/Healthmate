export interface Category {
  _id: string;
  name: string;
  description: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const res = await fetch("https://healthmate.onrender.com/api/workout-categories");

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json();
};