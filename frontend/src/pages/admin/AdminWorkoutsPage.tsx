import { useEffect, useState, useCallback } from "react";
import { getWorkouts, createWorkout } from "../../services/workoutService";
import type { Workout } from "../../services/workoutService";
import { getCategories } from "../../services/categoryService";
import type { Category } from "../../services/categoryService";
import { useNavigate } from "react-router-dom";
import "../../styles/admin-dashboard.css";

const AdminWorkoutsPage = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newWorkout, setNewWorkout] = useState<{
    title: string;
    cover_image: string;
    category_id: string;
    level: string;
    calories_burned: number;
    description: string;
    exercises: Array<{
      title: string;
      video_url: string;
      duration_sec: number;
      order: number;
    }>;
  }>({
    title: "",
    cover_image: "",
    category_id: "",
    level: "beginner",
    calories_burned: 0,
    description: "",
    exercises: [] as Array<{
      title: string;
      video_url: string;
      duration_sec: number;
      order: number;
    }>,
  });
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await getWorkouts(categoryId, level, search);
    setWorkouts(data);
    setLoading(false);
  }, [categoryId, level, search]);

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchData();
    };
    fetchInitialData();
  }, [level, categoryId, search, fetchData]);

  useEffect(() => {
    const loadInitialCategories = async () => {
      await loadCategories();
    };
    loadInitialCategories();
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
    } catch (err) {
      console.error("Create workout failed:", err);
      alert("Create workout failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight">Workout Management</h2>
          <p className="text-text-dim text-sm mt-1">Manage exercise library and workout programs</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-background-dark text-sm font-bold transition-colors shadow-[0_0_15px_rgba(19,236,91,0.3)]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Workout
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-surface-dark p-4 rounded-xl border border-[#28392e] flex flex-wrap items-center gap-4">
        <span className="font-semibold text-text-dim text-sm">
          FILTERS:
        </span>

        {/* Search */}
        <input
          type="text"
          placeholder="Search workout..."
          className="px-4 py-2 bg-background-dark border border-[#28392e] rounded-lg text-sm text-white placeholder-text-dim focus:border-primary focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Level Filter */}
        <select
          className="px-4 py-2 bg-background-dark border border-[#28392e] rounded-lg text-sm text-white focus:border-primary focus:outline-none"
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
          className="px-4 py-2 bg-background-dark border border-[#28392e] rounded-lg text-sm text-white focus:border-primary focus:outline-none"
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
          className="ml-auto text-sm text-text-dim hover:text-white transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-dark border border-[#28392e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm">Total Workouts</p>
              <p className="text-white text-2xl font-bold">{workouts.length}</p>
            </div>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">fitness_center</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface-dark border border-[#28392e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm">Categories</p>
              <p className="text-white text-2xl font-bold">{categories.length}</p>
            </div>
            <span className="material-symbols-outlined text-blue-400 bg-blue-400/10 p-2 rounded-lg">category</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface-dark border border-[#28392e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm">Avg Calories</p>
              <p className="text-white text-2xl font-bold">
                {workouts.length > 0 
                  ? Math.round(workouts.reduce((sum, w) => sum + w.calories_burned, 0) / workouts.length)
                  : 0}
              </p>
            </div>
            <span className="material-symbols-outlined text-yellow-400 bg-yellow-400/10 p-2 rounded-lg">local_fire_department</span>
          </div>
        </div>
      </div>

      {/* WORKOUT GRID */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-dim mt-4">Loading workouts...</p>
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-20 text-text-dim">
          <span className="material-symbols-outlined text-4xl mb-4">fitness_center</span>
          <p>No workouts found</p>
          <p className="text-sm mt-2">Try adjusting your filters or create a new workout</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workouts.map((w) => (
            <div
              key={w._id}
              onClick={() => navigate(`/admin/workouts/${w._id}`)}
              className="bg-surface-dark rounded-xl border border-[#28392e] overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-300 group"
            >
              {/* COVER IMAGE */}
              <div className="relative h-48 bg-gradient-to-br from-primary/20 to-transparent">
                <img
                  src={(w as Workout & { cover_image?: string }).cover_image || "https://via.placeholder.com/400x250"}
                  alt={w.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
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

                {/* ACTIONS */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle edit/delete actions
                    }}
                    className="p-2 bg-surface-dark/90 rounded-lg border border-[#28392e] hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">more_vert</span>
                  </button>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors">
                    {w.title}
                  </h3>
                </div>

                <p className="text-sm text-text-dim line-clamp-2 mb-3">
                  {w.description}
                </p>

                {/* FOOTER TAGS */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-[#28392e] text-text-dim px-2 py-1 rounded-full">
                    🔥 {w.calories_burned} kcal
                  </span>

                  {w.category_id && (
                    <span className="text-xs bg-[#28392e] text-text-dim px-2 py-1 rounded-full">
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

      {/* CREATE WORKOUT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-dark w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl p-8 border border-[#28392e] max-w-[90vw]">
            <h2 className="text-white text-2xl font-bold mb-6">Create New Workout</h2>

            <div className="flex flex-col gap-4">
              <input
                placeholder="Workout Title"
                className="px-4 py-3 bg-background-dark border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:border-primary focus:outline-none"
                value={newWorkout.title}
                onChange={(e) =>
                  setNewWorkout({ ...newWorkout, title: e.target.value })
                }
              />

              <input
                placeholder="Cover Image URL"
                className="px-4 py-3 bg-background-dark border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:border-primary focus:outline-none"
                value={newWorkout.cover_image}
                onChange={(e) =>
                  setNewWorkout({ ...newWorkout, cover_image: e.target.value })
                }
              />

              <select
                className="px-4 py-3 bg-background-dark border border-[#28392e] rounded-lg text-white focus:border-primary focus:outline-none"
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
                className="px-4 py-3 bg-background-dark border border-[#28392e] rounded-lg text-white focus:border-primary focus:outline-none"
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
                className="px-4 py-3 bg-background-dark border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:border-primary focus:outline-none"
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
                rows={4}
                className="px-4 py-3 bg-background-dark border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:border-primary focus:outline-none resize-none"
                value={newWorkout.description}
                onChange={(e) =>
                  setNewWorkout({ ...newWorkout, description: e.target.value })
                }
              />

              {/* Exercises */}
              <div>
                <h3 className="text-white font-semibold mb-3">Exercises</h3>

                {newWorkout.exercises.map((ex, index) => (
                  <div key={index} className="bg-background-dark border border-[#28392e] p-4 rounded-lg mb-3">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold text-white">Exercise #{index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      <input
                        placeholder="Exercise Title"
                        className="px-3 py-2 bg-surface-dark border border-[#28392e] rounded text-sm text-white placeholder-text-dim focus:border-primary focus:outline-none"
                        value={ex.title}
                        onChange={(e) => {
                          const updated = [...newWorkout.exercises];
                          updated[index].title = e.target.value;
                          setNewWorkout({ ...newWorkout, exercises: updated });
                        }}
                      />

                      <input
                        placeholder="Video URL"
                        className="px-3 py-2 bg-surface-dark border border-[#28392e] rounded text-sm text-white placeholder-text-dim focus:border-primary focus:outline-none"
                        value={ex.video_url}
                        onChange={(e) => {
                          const updated = [...newWorkout.exercises];
                          updated[index].video_url = e.target.value;
                          setNewWorkout({ ...newWorkout, exercises: updated });
                        }}
                      />

                      <input
                        type="number"
                        placeholder="Duration (seconds)"
                        className="px-3 py-2 bg-surface-dark border border-[#28392e] rounded text-sm text-white placeholder-text-dim focus:border-primary focus:outline-none"
                        value={ex.duration_sec}
                        onChange={(e) => {
                          const updated = [...newWorkout.exercises];
                          updated[index].duration_sec = Number(e.target.value);
                          setNewWorkout({ ...newWorkout, exercises: updated });
                        }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addExercise}
                  className="w-full py-2 bg-[#28392e] hover:bg-[#344b3c] text-white rounded-lg transition-colors border border-[#28392e] hover:border-primary/30"
                >
                  + Add Exercise
                </button>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg border border-[#28392e] text-text-dim hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateWorkout}
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-background-dark rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(19,236,91,0.3)]"
                >
                  Create Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkoutsPage;
