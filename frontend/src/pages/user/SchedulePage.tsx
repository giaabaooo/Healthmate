import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getDailyRoutine, updateDailyRoutine } from "../../services/workoutService";

// ─── Helper: Lấy chuỗi ngày YYYY-MM-DD chuẩn múi giờ địa phương ───
const getLocalDateString = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dateNum = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateNum}`;
};

// ─── Sub-components ───
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const SchedulePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const displayName = parsedUser?.profile?.full_name || 'User';

  // --- States ---
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today);
    monday.setDate(diff);
    return monday;
  });

  const [routine, setRoutine] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  // Edit Modal States
  const [editModal, setEditModal] = useState<{ isOpen: boolean; dateStr: string; index: number; event: any } | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // --- Lấy dữ liệu lịch tập từ DB ---
  const loadRoutine = async () => {
    setLoading(true);
    try {
      const data = await getDailyRoutine();
      setRoutine(data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutine();
  }, []);

  // --- Tạo mảng 7 ngày của tuần hiện tại ---
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return {
      dateObj: d,
      dateStr: getLocalDateString(d),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      isToday: getLocalDateString(new Date()) === getLocalDateString(d)
    };
  });

  // --- Chuyển Tuần ---
  const prevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const monthYearStr = currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // --- Modal Hành Động ---
  const openEditModal = (dateStr: string, index: number, event: any) => {
    setEditStartTime(event.startTime);
    setEditEndTime(event.endTime);
    setEditModal({ isOpen: true, dateStr, index, event });
  };

  const closeEditModal = () => setEditModal(null);

  const saveEdit = async () => {
    if (!editModal) return;
    if (editStartTime >= editEndTime) {
      alert("Thời gian kết thúc phải lớn hơn thời gian bắt đầu!");
      return;
    }

    const { dateStr, index } = editModal;
    const dayExercises = [...(routine[dateStr] || [])];
    
    // Cập nhật giờ mới
    dayExercises[index].startTime = editStartTime;
    dayExercises[index].endTime = editEndTime;

    // Sắp xếp lại theo giờ cho gọn
    dayExercises.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Cập nhật UI & gọi API
    setRoutine(prev => ({ ...prev, [dateStr]: dayExercises }));
    closeEditModal();

    try {
      await updateDailyRoutine({ date: dateStr, exercises: dayExercises });
    } catch (err) {
      alert("Lỗi khi lưu. Vui lòng thử lại.");
    }
  };

  const deleteEvent = async () => {
    if (!editModal || !window.confirm("Bạn có chắc chắn muốn xóa bài tập này khỏi lịch?")) return;

    const { dateStr, index } = editModal;
    const dayExercises = [...(routine[dateStr] || [])];
    dayExercises.splice(index, 1); // Xóa khỏi mảng

    setRoutine(prev => ({ ...prev, [dateStr]: dayExercises }));
    closeEditModal();

    try {
      await updateDailyRoutine({ date: dateStr, exercises: dayExercises });
    } catch (err) {
      alert("Lỗi khi xóa.");
    }
  };

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <div className="flex flex-1">

          {/* ── Sidebar Dọn Dẹp Sạch Sẽ ── */}
          

          {/* ── Main Content ── */}
          <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full min-w-0">
            <div className="flex flex-col h-full gap-6">

              {/* Page Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    My Schedule
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Quản lý và chỉnh sửa lịch tập luyện trong tuần của bạn.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate('/workouts')} className="flex items-center gap-2 bg-primary text-slate-900 px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
                    <Icon name="add" className="text-sm" /> Thêm Bài Tập Mới
                  </button>
                </div>
              </div>

              {/* ── Calendar Grid ── */}
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">

                {/* Calendar Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <button onClick={prevWeek} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                      <Icon name="chevron_left" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white min-w-[150px] text-center">
                      {monthYearStr}
                    </h2>
                    <button onClick={nextWeek} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                      <Icon name="chevron_right" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" /> Có bài tập
                    </div>
                  </div>
                </div>

                {/* Calendar Body */}
                <div className="flex-1 overflow-x-auto">
                  <div className="min-w-[900px] h-full flex flex-col">

                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      {weekDays.map(({ dateStr, dayName, dateNum, isToday }) => (
                        <div
                          key={dateStr}
                          className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}
                        >
                          <span className={`block text-xs font-medium uppercase ${isToday ? 'text-primary font-bold' : 'text-slate-500'}`}>
                            {dayName}
                          </span>
                          <span className={`block text-lg font-bold ${isToday ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                            {dateNum}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Day columns */}
                    <div className="grid grid-cols-7 flex-1 min-h-[500px]">
                      {weekDays.map(({ dateStr, isToday }) => {
                        const dayEvents = routine[dateStr] || [];
                        
                        return (
                        <div
                          key={dateStr}
                          className={`border-r border-slate-200 dark:border-slate-800 last:border-r-0 p-2 space-y-2 relative transition-colors ${
                            isToday ? 'bg-primary/5' : 'bg-transparent'
                          }`}
                        >
                          {loading ? (
                             <div className="text-xs text-slate-400 text-center mt-4">Loading...</div>
                          ) : dayEvents.length === 0 ? (
                             <div className="text-[10px] text-slate-300 text-center mt-4 italic">Trống</div>
                          ) : (
                            dayEvents.map((ev: any, i: number) => (
                              <div
                                key={i}
                                onClick={() => openEditModal(dateStr, i, ev)}
                                className={`bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary p-2 rounded shadow-sm hover:shadow-md cursor-pointer transition-all`}
                              >
                                <p className={`text-[10px] font-mono mb-0.5 text-blue-500 dark:text-blue-400 font-bold`}>{ev.startTime} - {ev.endTime}</p>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={ev.name}>{ev.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-1">🔥 {ev.calories || 0} kcal</p>
                              </div>
                            ))
                          )}
                        </div>
                      )})}
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </main>

        </div>
      </div>

      {/* --- MODAL CHỈNH SỬA THỜI GIAN --- */}
      {editModal?.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Chỉnh sửa Lịch tập</h3>
                  <p className="text-xs font-bold text-primary truncate">{editModal.event.name}</p>
              </div>
              
              <div className="p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Giờ Bắt Đầu</label>
                        <input 
                           type="time" 
                           value={editStartTime} 
                           onChange={(e) => setEditStartTime(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Giờ Kết Thúc</label>
                        <input 
                           type="time" 
                           value={editEndTime} 
                           onChange={(e) => setEditEndTime(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none focus:border-primary"
                        />
                    </div>
                  </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={deleteEvent} className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1">
                    <Icon name="delete" className="text-base" /> Xóa
                  </button>
                  <div className="flex gap-2">
                    <button onClick={closeEditModal} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Hủy</button>
                    <button onClick={saveEdit} className="px-5 py-2 bg-primary text-slate-900 text-sm font-bold rounded-lg hover:brightness-110 transition-all shadow-sm">Lưu</button>
                  </div>
              </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default SchedulePage;