import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import {
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} from "../../services/workoutService";

const WorkoutDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      getWorkoutById(id).then(setWorkout);
    }
  }, [id]);

  if (!workout)
    return (
      <div className="p-10 text-center text-lg font-semibold">
        Loading...
      </div>
    );

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa bài tập này?")) return;

    await deleteWorkout(workout._id);
    navigate("/workouts");
  };

 const handleUpdate = async () => {
  try {
    const updatedData = {
      title: workout.title,
      description: workout.description,
      cover_image: workout.cover_image,
      level: workout.level,
      calories_burned: workout.calories_burned,
      category_id:
        typeof workout.category_id === "object"
          ? workout.category_id._id
          : workout.category_id,
      exercises: workout.exercises,
    };

    const res = await updateWorkout(workout._id, updatedData);

    setWorkout(res); // 👈 update lại state từ backend
    setIsEditing(false);

    alert("Cập nhật thành công!");
  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
};
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <Navbar />

      <div className="p-8 max-w-6xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate("/workouts")}
          className="mb-6 px-5 py-2 bg-slate-800 text-white rounded-full"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-10">

          {/* Cover Image */}
          {workout.cover_image && (
            <img
              src={workout.cover_image}
              alt="cover"
              className="w-full h-64 object-cover rounded-xl mb-6"
            />
          )}

          {isEditing ? (
            <>
              <input
                type="text"
                value={workout.title}
                onChange={(e) =>
                  setWorkout({ ...workout, title: e.target.value })
                }
                className="w-full p-3 border rounded mb-4"
              />

              <textarea
                value={workout.description}
                onChange={(e) =>
                  setWorkout({ ...workout, description: e.target.value })
                }
                className="w-full p-3 border rounded mb-4"
              />

              <input
                type="text"
                placeholder="Cover image URL"
                value={workout.cover_image || ""}
                onChange={(e) =>
                  setWorkout({ ...workout, cover_image: e.target.value })
                }
                className="w-full p-3 border rounded mb-4"
              />

              <button
                onClick={handleUpdate}
                className="px-5 py-2 bg-green-600 text-white rounded mr-3"
              >
                Save
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-3">
                {workout.title}
              </h1>

              <p className="text-slate-600 mb-4">
                {workout.description}
              </p>

              <div className="inline-block bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-semibold">
                🔥 {workout.calories_burned} kcal burned
              </div>

              <div className="mt-6 space-x-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 bg-blue-600 text-white rounded"
                >
                  Edit
                </button>

                <button
                  onClick={handleDelete}
                  className="px-5 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Exercises */}
        <h2 className="text-2xl font-bold mb-6">Exercises</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {workout.exercises.map((ex: any, index: number) => {
            const videoId = getYoutubeId(ex.video_url);
            const embedUrl = videoId
              ? `https://www.youtube.com/embed/${videoId}`
              : null;

            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {embedUrl && (
                  <div className="aspect-video">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">
                    {ex.title}
                  </h3>

                  <span>⏱ {ex.duration_sec} sec</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetailPage;