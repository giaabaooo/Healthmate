import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getWorkouts, createWorkout } from "../../services/workoutService";
import type { Workout } from "../../services/workoutService";
import { getCategories } from "../../services/categoryService";
import type { Category } from "../../services/categoryService";
import { useNavigate } from "react-router-dom";

const WorkoutsPage = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
   const [newWorkout, setNewWorkout] = useState({
  title: "",
  cover_image: "",
  category_id: "",
  level: "beginner",
  calories_burned: 0,
  description: "",
  exercises: [] as any[],
});
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    const data = await getWorkouts(categoryId, level, search);
    setWorkouts(data);
    setLoading(false);
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  useEffect(() => {
    fetchData();
  }, [level, categoryId, search]);

  useEffect(() => {
    loadCategories();
  }, []);

  const clearFilters = () => {
    setLevel("");
    setCategoryId("");
    setSearch("");
  };
const getLevelBadgeStyle = (level: string) => {
  switch (level) {
    case "beginner":
      return "bg-green-500 text-white";
    case "intermediate":
      return "bg-yellow-500 text-white";
    case "advanced":
      return "bg-red-500 text-white";
    default:
      return "bg-slate-500 text-white";
  }
   

};
const addExercise = () => {
  setNewWorkout({
    ...newWorkout,
    exercises: [
      ...newWorkout.exercises,
      {
        title: "",
        video_url: "",
        duration_sec: 0,
        order: newWorkout.exercises.length + 1,
      },
    ],
  });
};
const removeExercise = (index: number) => {
  const updated = [...newWorkout.exercises];
  updated.splice(index, 1);

  // cập nhật lại order
  const reordered = updated.map((ex, i) => ({
    ...ex,
    order: i + 1,
  }));

  setNewWorkout({
    ...newWorkout,
    exercises: reordered,
  });
};
const handleCreateWorkout = async () => {
  try {
    await createWorkout(newWorkout);
    setShowModal(false);
    setNewWorkout({
      title: "",
      cover_image: "",
      category_id: "",
      level: "beginner",
      calories_burned: 0,
      description: "",
      exercises: [],
    });
    fetchData(); // reload list
  } catch (error) {
    alert("Create workout failed");
  }
};
  return (
    <Layout>
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      

      <div className="px-10 py-10 max-w-7xl mx-auto flex flex-col gap-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black">
              Exercise Library & Programs
            </h1>
            <p className="text-slate-500 mt-2">
              Explore workouts curated for your fitness goals
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="h-12 px-6 bg-slate-900 text-white rounded-xl font-semibold shadow hover:bg-slate-800 transition"
          >
            + Create Custom Workout
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow flex flex-wrap items-center gap-4">

          <span className="font-semibold text-slate-500">
            FILTERS:
          </span>

          {/* Search */}
          <input
            type="text"
            placeholder="Search workout..."
            className="px-4 py-2 border rounded-lg text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Level Filter */}
          <select
            className="px-4 py-2 border rounded-lg text-sm"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="">Level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Category Filter */}
          <select
            className="px-4 py-2 border rounded-lg text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Clear */}
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-slate-500 hover:text-black"
          >
            Clear All
          </button>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            No workouts found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {workouts.map((w) => (
    <div
      key={w._id}
      onClick={() => navigate(`/workouts/${w._id}`)}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
    >
      {/* COVER IMAGE */}
      <div className="relative">
        <img
          src={ "https://via.placeholder.com/400x250"}
          alt={w.title}
          className="w-full h-52 object-cover"
        />

        {/* BADGE */}
       {w.level && (
  <span
    className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-md uppercase ${getLevelBadgeStyle(
      w.level
    )}`}
  >
    {w.level}
  </span>
)}
      </div>

      {/* CONTENT */}
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg leading-tight">
            {w.title}
          </h3>

          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md capitalize">
            {w.level}
          </span>
        </div>

        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
          {w.description}
        </p>

        {/* FOOTER TAGS */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
            🔥 {w.calories_burned} kcal
          </span>

          {w.category_id && (
            <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
              {typeof w.category_id === "object"
                ? w.category_id.name
                : "Category"}
            </span>
          )}
        </div>
      </div>
    </div>
  ))}
</div>
        )}
      </div>

     {showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl p-8 shadow-xl">
      <h2 className="text-2xl font-bold mb-6">Create Workout</h2>

      <div className="flex flex-col gap-4">

        <input
          placeholder="Title"
          className="border p-3 rounded-lg"
          value={newWorkout.title}
          onChange={(e) =>
            setNewWorkout({ ...newWorkout, title: e.target.value })
          }
        />

        <input
          placeholder="Cover Image URL"
          className="border p-3 rounded-lg"
          value={newWorkout.cover_image}
          onChange={(e) =>
            setNewWorkout({ ...newWorkout, cover_image: e.target.value })
          }
        />

        <select
          className="border p-3 rounded-lg"
          value={newWorkout.category_id}
          onChange={(e) =>
            setNewWorkout({ ...newWorkout, category_id: e.target.value })
          }
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          className="border p-3 rounded-lg"
          value={newWorkout.level}
          onChange={(e) =>
            setNewWorkout({ ...newWorkout, level: e.target.value })
          }
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <input
          type="number"
          placeholder="Calories Burned"
          className="border p-3 rounded-lg"
          value={newWorkout.calories_burned}
          onChange={(e) =>
            setNewWorkout({
              ...newWorkout,
              calories_burned: Number(e.target.value),
            })
          }
        />

        <textarea
          placeholder="Description"
          className="border p-3 rounded-lg"
          value={newWorkout.description}
          onChange={(e) =>
            setNewWorkout({ ...newWorkout, description: e.target.value })
          }
        />

        {/* Exercises */}
        <div>
          <h3 className="font-semibold mb-2">Exercises</h3>

          {newWorkout.exercises.map((ex, index) => (
            <div key={index} className="border p-4 rounded-lg mb-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-semibold text-slate-700">Exercise #{index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeExercise(index)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <input
                placeholder="Exercise Title"
                className="border p-2 rounded w-full mb-2"
                value={ex.title}
                onChange={(e) => {
                  const updated = [...newWorkout.exercises];
                  updated[index].title = e.target.value;
                  setNewWorkout({ ...newWorkout, exercises: updated });
                }}
              />

              <input
                placeholder="Video URL"
                className="border p-2 rounded w-full mb-2"
                value={ex.video_url}
                onChange={(e) => {
                  const updated = [...newWorkout.exercises];
                  updated[index].video_url = e.target.value;
                  setNewWorkout({ ...newWorkout, exercises: updated });
                }}
              />

              <input
                type="number"
                placeholder="Duration (sec)"
                className="border p-2 rounded w-full"
                value={ex.duration_sec}
                onChange={(e) => {
                  const updated = [...newWorkout.exercises];
                  updated[index].duration_sec = Number(e.target.value);
                  setNewWorkout({ ...newWorkout, exercises: updated });
                }}
              />
            </div>
          ))}

          <button
            onClick={addExercise}
            className="bg-slate-200 px-4 py-2 rounded-lg"
          >
            + Add Exercise
          </button>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => setShowModal(false)}
            className="px-6 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateWorkout}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg"
          >
            Create Workout
          </button>
        </div>
      </div>
    </div>
  </div>
)}

  </div>
  </Layout>
);
};

export default WorkoutsPage;