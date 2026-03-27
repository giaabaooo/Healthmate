import React, { useEffect, useState, useCallback } from "react";
import { getWorkouts, createWorkout } from "../../services/workoutService";
import type { Workout } from "../../services/workoutService";
import { getCategories } from "../../services/categoryService";
import type { Category } from "../../services/categoryService";
import AdminLayout from "../../components/AdminLayout";
import toast, { Toaster } from "react-hot-toast";

const AdminWorkoutsPage = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    exercises: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [workoutsData, categoriesData] = await Promise.all([
        getWorkouts({ search, level, categoryId }),
        getCategories(),
      ]);
      
      // FIX LỖI "LENGTH" Ở ĐÂY: Đảm bảo luôn luôn là Mảng (Array)
      const parsedWorkouts = Array.isArray(workoutsData) ? workoutsData : (workoutsData?.data || []);
      const parsedCategories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
      
      setWorkouts(parsedWorkouts);
      setCategories(parsedCategories);
    } catch (error) {
      toast.error("Không thể tải dữ liệu.");
      setWorkouts([]); // Fallback an toàn
      setCategories([]); // Fallback an toàn
    } finally {
      setLoading(false);
    }
  }, [search, level, categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateWorkout = async () => {
    if (!newWorkout.title || !newWorkout.category_id || !newWorkout.cover_image) {
        toast.error("Vui lòng điền đầy đủ Tên, Danh mục và Hình ảnh.");
        return;
    }
    
    setIsSubmitting(true);
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
      fetchData();
      toast.success("Tạo bài tập mới thành công!");
    } catch (error) {
      toast.error("Lỗi khi tạo bài tập.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn bài tập này khỏi hệ thống? Hành động này không thể hoàn tác.')) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://healthmate-y9vt.onrender.com/api/workouts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setWorkouts(prev => (prev || []).filter(w => w._id !== id));
                toast.success("Đã xóa bài tập thành công.");
            } else {
                toast.error("Lỗi khi xóa bài tập.");
            }
        } catch (error) {
            toast.error("Lỗi kết nối đến máy chủ.");
        }
    }
  };

  const addExercise = () => {
    setNewWorkout({
      ...newWorkout,
      exercises: [
        ...(newWorkout.exercises || []),
        {
          title: "",
          video_url: "",
          duration_sec: 60,
          order: (newWorkout.exercises || []).length + 1,
        },
      ],
    });
  };

  const removeExercise = (index: number) => {
    const updated = [...(newWorkout.exercises || [])];
    updated.splice(index, 1);
    // Cập nhật lại thứ tự
    updated.forEach((ex, i) => { ex.order = i + 1; });
    setNewWorkout({ ...newWorkout, exercises: updated });
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto w-full pb-10 animate-fade-in">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Quản lý Workouts</h1>
                <p className="text-slate-500 dark:text-slate-400">Thêm, sửa, xóa các bài tập và lộ trình tập luyện.</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-primary text-slate-900 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:brightness-110 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">add</span> Thêm Bài Tập
            </button>
        </div>

        {/* FILTERS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                    type="text" placeholder="Tìm kiếm bài tập..." 
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white transition-colors"
                />
            </div>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full md:w-48 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white transition-colors">
                <option value="">Tất cả cấp độ</option>
                <option value="beginner">Người mới</option>
                <option value="intermediate">Trung bình</option>
                <option value="advanced">Nâng cao</option>
            </select>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full md:w-48 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white transition-colors">
                <option value="">Tất cả danh mục</option>
                {(categories || []).map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
            </select>
        </div>

        {/* TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bài tập</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cấp độ</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Calo/Thời gian</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500"><span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span></td></tr>
                        ) : (!workouts || workouts.length === 0) ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Không tìm thấy bài tập nào.</td></tr>
                        ) : (
                            workouts.map((w: any) => (
                                <tr key={w._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={w.cover_image || 'https://placehold.co/100x100?text=No+Image'} alt={w.title} className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{w.title}</h3>
                                                <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px] mt-0.5">{w.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                                            {w.category_id?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${w.level === 'advanced' ? 'bg-rose-100 text-rose-600' : w.level === 'intermediate' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {w.level}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">local_fire_department</span> {w.calories_burned} kcal</span>
                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span> {w.exercises?.length || 0} bài</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(w._id)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="Xóa">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* CREATE MODAL */}
        {showModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl my-8 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">fitness_center</span> Thêm Workout Mới
                        </h2>
                        <button onClick={() => setShowModal(false)} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    
                    <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar max-h-[70vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Tên bài tập</label>
                                <input type="text" value={newWorkout.title} onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary dark:text-white" placeholder="VD: Full Body HIIT" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Link ảnh bìa</label>
                                <input type="text" value={newWorkout.cover_image} onChange={(e) => setNewWorkout({ ...newWorkout, cover_image: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary dark:text-white" placeholder="URL hình ảnh" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Danh mục</label>
                                <select value={newWorkout.category_id} onChange={(e) => setNewWorkout({ ...newWorkout, category_id: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary dark:text-white">
                                    <option value="">Chọn danh mục</option>
                                    {(categories || []).map((cat) => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Cấp độ</label>
                                <select value={newWorkout.level} onChange={(e) => setNewWorkout({ ...newWorkout, level: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary dark:text-white">
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Calo Tiêu thụ (Kcal)</label>
                                <input type="number" value={newWorkout.calories_burned} onChange={(e) => setNewWorkout({ ...newWorkout, calories_burned: Number(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary dark:text-white" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Mô tả chi tiết</label>
                                <textarea value={newWorkout.description} onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary dark:text-white resize-none" placeholder="Mô tả bài tập..." />
                            </div>
                        </div>

                        {/* EXERCISES LIST */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm dark:text-white">Danh sách Động tác ({(newWorkout.exercises || []).length})</h3>
                                <button onClick={addExercise} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded transition-colors">+ Thêm động tác</button>
                            </div>
                            
                            <div className="space-y-3">
                                {(newWorkout.exercises || []).map((ex, index) => (
                                    <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl relative">
                                        <button onClick={() => removeExercise(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>
                                        <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">Động tác {index + 1}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input type="text" placeholder="Tên động tác (VD: Push ups)" value={ex.title} onChange={(e) => {
                                                const updated = [...(newWorkout.exercises || [])];
                                                updated[index].title = e.target.value;
                                                setNewWorkout({ ...newWorkout, exercises: updated });
                                            }} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-primary dark:text-white" />
                                            <input type="text" placeholder="Link Video (YouTube/MP4)" value={ex.video_url} onChange={(e) => {
                                                const updated = [...(newWorkout.exercises || [])];
                                                updated[index].video_url = e.target.value;
                                                setNewWorkout({ ...newWorkout, exercises: updated });
                                            }} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-primary dark:text-white" />
                                            <div className="md:col-span-2 flex items-center gap-3">
                                                <label className="text-xs text-slate-500 font-bold whitespace-nowrap">Thời gian (giây):</label>
                                                <input type="number" value={ex.duration_sec} onChange={(e) => {
                                                    const updated = [...(newWorkout.exercises || [])];
                                                    updated[index].duration_sec = Number(e.target.value);
                                                    setNewWorkout({ ...newWorkout, exercises: updated });
                                                }} className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-primary dark:text-white text-center" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900 mt-auto">
                        <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">Hủy</button>
                        <button onClick={handleCreateWorkout} disabled={isSubmitting} className="px-6 py-2.5 bg-primary text-slate-900 text-sm font-bold rounded-xl hover:brightness-110 shadow-sm transition-all flex items-center gap-2">
                            {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
                            Lưu bài tập
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminWorkoutsPage;