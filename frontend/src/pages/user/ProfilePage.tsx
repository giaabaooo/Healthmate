import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import toast, { Toaster } from 'react-hot-toast';
import { getDailyRoutine } from '../../services/workoutService';
import { getTodayProgress } from '../../services/progressService';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface Profile {
  full_name?: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  goal?: 'muscle_gain' | 'fat_loss' | 'maintain';
  phone_number?: string;
  address?: string;
}

interface UserResponse {
  _id: string;
  email: string;
  role: string;
  profile?: Profile;
}

interface TodayEvent {
  title: string;
  desc: string;
  time: string;
  icon: string;
  color: string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// ─── Component ──────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  
  // States cho hiển thị
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States cho Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Profile>({});
  
  // Dữ liệu Today Plan (Lịch tập + Ăn uống thật)
  const [todayPlan, setTodayPlan] = useState<TodayEvent[]>([]);
  const [planLoading, setPlanLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Lấy dữ liệu Profile
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Không thể tải thông tin hồ sơ.');
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
        return;
      }

      setUser(data);
      setFormData({
        full_name: data.profile?.full_name || '',
        gender: data.profile?.gender || 'male',
        birth_date: data.profile?.birth_date ? data.profile.birth_date.split('T')[0] : '',
        height_cm: data.profile?.height_cm || undefined,
        weight_kg: data.profile?.weight_kg || undefined,
        goal: data.profile?.goal || 'maintain',
        phone_number: data.profile?.phone_number || '',
        address: data.profile?.address || '',
      });
    } catch {
      setError('Có lỗi xảy ra khi kết nối tới server.');
    } finally {
      setLoading(false);
    }
  };

  // Lấy dữ liệu Lịch trình hôm nay (Schedule + Meal Plan)
  const loadTodayPlan = async () => {
      setPlanLoading(true);
      try {
          const [routineRes, progressRes] = await Promise.all([
              getDailyRoutine(),
              getTodayProgress()
          ]);

          // 1. Lấy bài tập hôm nay
          const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
          let events: TodayEvent[] = [];
          
          // Định dạng ngày có thể khác nhau tùy múi giờ, thử tìm key chứa chuỗi hôm nay
          const todayKey = Object.keys(routineRes || {}).find(k => k.includes(new Date().toISOString().split('T')[0])) 
                           || new Date().toISOString().split('T')[0];
                           
          const todayExercises = routineRes?.[todayKey] || [];
          
          todayExercises.forEach((ex: any) => {
             events.push({
                 title: ex.name || 'Workout',
                 desc: `Thời gian tập: ${ex.duration || 30} phút • Đốt cháy: ${ex.calories || 0} kcal`,
                 time: `${ex.startTime} - ${ex.endTime}`,
                 icon: 'exercise',
                 color: 'border-blue-500 text-blue-500'
             });
          });

          // 2. Lấy tình trạng ăn uống
          if (progressRes) {
              if (progressRes.totalCalo > 0) {
                  events.push({
                      title: 'Dinh dưỡng trong ngày',
                      desc: `Đã nạp: ${progressRes.totalCalo} kcal / Protein: ${Math.round(progressRes.totalProtein || 0)}g`,
                      time: 'All day',
                      icon: 'restaurant',
                      color: 'border-primary text-primary'
                  });
              }
              if (progressRes.water_ml > 0) {
                  events.push({
                      title: 'Cấp nước (Hydration)',
                      desc: `Đã uống: ${progressRes.water_ml} ml nước.`,
                      time: 'Cập nhật liên tục',
                      icon: 'water_drop',
                      color: 'border-cyan-400 text-cyan-500'
                  });
              }
          }

          setTodayPlan(events);
      } catch (err) {
          console.error("Lỗi lấy lịch hôm nay:", err);
      } finally {
          setPlanLoading(false);
      }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const isGoogle = localStorage.getItem('isGoogleLogin');
    if (isGoogle === 'true') {
        const localUser = localStorage.getItem('user');
        if (localUser) {
            const parsed = JSON.parse(localUser);
            setUser(parsed);
            setFormData(parsed.profile || {});
        }
        setLoading(false);
        loadTodayPlan();
        return; 
    }
    fetchProfile();
    loadTodayPlan();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // --- VALIDATION & SUBMIT ---
  const handleSaveProfile = async () => {
      if (!formData.full_name?.trim()) return toast.error("Họ và tên không được để trống!");
      
      const h = Number(formData.height_cm);
      const w = Number(formData.weight_kg);
      if (formData.height_cm && (h < 50 || h > 250)) return toast.error("Chiều cao không hợp lệ (50-250cm)");
      if (formData.weight_kg && (w < 20 || w > 300)) return toast.error("Cân nặng không hợp lệ (20-300kg)");
      
      if (formData.birth_date) {
          const year = new Date(formData.birth_date).getFullYear();
          const currentYear = new Date().getFullYear();
          if (currentYear - year < 10) return toast.error("Bạn phải trên 10 tuổi để sử dụng app.");
      }

      if (formData.phone_number && !/^[0-9+\-\s()]*$/.test(formData.phone_number)) {
          return toast.error("Số điện thoại không hợp lệ.");
      }

      try {
          const res = await fetch('http://localhost:8000/api/users/profile', {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({ profile: formData })
          });

          if (res.ok) {
              const data = await res.json();
              toast.success("Cập nhật hồ sơ thành công!");
              setUser(prev => prev ? { ...prev, profile: data.profile } : null);
              
              // Update local storage
              const localUserStr = localStorage.getItem('user');
              if (localUserStr) {
                  const localUser = JSON.parse(localUserStr);
                  localUser.profile = data.profile;
                  localStorage.setItem('user', JSON.stringify(localUser));
              }
              setIsEditing(false);
          } else {
              const err = await res.json();
              toast.error(err.message || "Có lỗi xảy ra.");
          }
      } catch (err) {
          toast.error("Lỗi kết nối mạng.");
      }
  };

  // --- Helpers UI ---
  const getBmiLabel = (bmiVal: number) => {
    if (bmiVal < 18.5) return 'Thiếu cân';
    if (bmiVal < 25) return 'Bình thường';
    if (bmiVal < 30) return 'Thừa cân';
    return 'Béo phì';
  };

  const bmiHeight = user?.profile?.height_cm;
  const bmiWeight = user?.profile?.weight_kg;
  const bmi = bmiHeight && bmiWeight ? (bmiWeight / Math.pow(bmiHeight / 100, 2)).toFixed(1) : null;

  if (!token) return null;

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#f8fafc] dark:bg-[#0f172a]">
          <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
            
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Hồ sơ cá nhân
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                  Quản lý thông tin để HealthMate gợi ý lịch trình chính xác nhất.
                </p>
              </div>
              <div className="flex items-center gap-3">
                  {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="h-10 px-5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">edit</span> Chỉnh sửa
                      </button>
                  ) : (
                      <>
                        <button onClick={() => setIsEditing(false)} className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Hủy
                        </button>
                        <button onClick={handleSaveProfile} className="h-10 px-6 rounded-xl bg-primary text-slate-900 text-sm font-bold shadow-sm hover:brightness-105 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">save</span> Lưu lại
                        </button>
                      </>
                  )}
                  <button onClick={handleLogout} className="h-10 px-4 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:border-red-900 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-sm font-bold transition-colors">
                    Đăng xuất
                  </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center text-slate-500 py-10 font-medium animate-pulse">Đang tải dữ liệu...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ─── CỘT TRÁI (THÔNG TIN CÁ NHÂN) ─── */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Card Thông tin cơ bản */}
                  <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined">badge</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Thông tin cơ bản</h2>
                    </div>

                    {error && (
                      <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 relative z-10">
                        {error}
                      </div>
                    )}

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-5 py-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                               <img src="https://www.svgrepo.com/show/5125/avatar.svg" alt="avatar" className="w-full h-full object-cover" />
                           </div>
                           <div>
                               <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{user?.profile?.full_name || 'Người dùng'}</p>
                               <p className="text-xs font-medium text-slate-500">{user?.email}</p>
                           </div>
                        </div>
                        <div className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full uppercase tracking-wider self-start md:self-auto">
                            {user?.role === 'admin' ? 'Admin' : 'Member'}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 animate-fade-in">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Họ và tên *</label>
                                <input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary transition-colors" placeholder="Nguyễn Văn A"/>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Giới tính</label>
                                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary transition-colors">
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày sinh</label>
                                <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary transition-colors" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mục tiêu chính</label>
                                <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value as any})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary transition-colors">
                                    <option value="muscle_gain">Tăng cơ</option>
                                    <option value="fat_loss">Giảm mỡ</option>
                                    <option value="maintain">Duy trì sức khỏe</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chiều cao (cm)</label>
                                <input type="number" min={50} max={250} value={formData.height_cm || ''} onChange={e => setFormData({...formData, height_cm: Number(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary transition-colors" placeholder="170" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cân nặng (kg)</label>
                                <input type="number" min={20} max={300} value={formData.weight_kg || ''} onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary transition-colors" placeholder="65" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số điện thoại</label>
                                <input value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary transition-colors" placeholder="0987654..." />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Địa chỉ</label>
                                <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary transition-colors" placeholder="Hà Nội, VN" />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 relative z-10 animate-fade-in">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chiều cao</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {user?.profile?.height_cm || '—'} <span className="text-xs text-slate-500 font-medium">cm</span>
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cân nặng</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {user?.profile?.weight_kg || '—'} <span className="text-xs text-slate-500 font-medium">kg</span>
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giới tính</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {user?.profile?.gender === 'male' ? 'Nam' : user?.profile?.gender === 'female' ? 'Nữ' : user?.profile?.gender === 'other' ? 'Khác' : '—'}
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {user?.profile?.birth_date ? new Date(user.profile.birth_date).toLocaleDateString('vi-VN') : '—'}
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.profile?.phone_number || '—'}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={user?.profile?.address}>{user?.profile?.address || '—'}</p>
                            </div>
                        </div>
                    )}
                  </section>
                </div>

                {/* ─── CỘT PHẢI (BMI & KẾ HOẠCH HÔM NAY THỰC TẾ) ─── */}
                <div className="flex flex-col gap-6">
                  
                  {/* BMI Card */}
                  <section className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <h2 className="text-lg font-black flex items-center gap-2">
                          <Icon name="monitor_weight" className="text-primary"/> Chỉ số BMI
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hiện tại</p>
                        <p className="text-3xl font-black text-primary leading-none">
                          {bmi ?? '—'}
                        </p>
                        <p className="text-[10px] text-white bg-white/10 px-2 py-0.5 rounded mt-2 font-medium">
                          {bmi ? getBmiLabel(Number(bmi)) : 'Chưa có'}
                        </p>
                      </div>
                      
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mục tiêu</p>
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1">
                           <Icon name={user?.profile?.goal === 'muscle_gain' ? 'fitness_center' : user?.profile?.goal === 'fat_loss' ? 'local_fire_department' : 'spa'} className="text-amber-400 text-xl" />
                        </div>
                        <p className="text-xs font-bold text-white mt-1 uppercase">
                          {user?.profile?.goal === 'muscle_gain' ? 'Tăng cơ' : user?.profile?.goal === 'fat_loss' ? 'Giảm mỡ' : user?.profile?.goal === 'maintain' ? 'Duy trì' : '—'}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Lịch Trình Hôm Nay THỰC TẾ (Lấy từ API) */}
                  <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center"><Icon name="event_available" className="text-[18px]"/></div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Lịch Hôm Nay</h2>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{new Date().toLocaleDateString('vi-VN')}</span>
                    </div>
                    
                    <div className="space-y-3">
                      {planLoading ? (
                          <p className="text-sm text-center text-slate-400 py-4 animate-pulse">Đang đồng bộ lịch...</p>
                      ) : todayPlan.length === 0 ? (
                          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                             <p className="text-sm font-medium text-slate-500 mb-2">Chưa có hoạt động nào hôm nay.</p>
                             <button onClick={() => navigate('/workouts')} className="text-xs font-bold text-primary hover:underline">Vào mục Schedule để xếp lịch</button>
                          </div>
                      ) : (
                          todayPlan.map((ev, idx) => (
                            <div key={idx} className={`flex items-start gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 border-l-4 ${ev.color.split(' ')[0]}`}>
                              <div className={`${ev.color.split(' ')[1]} mt-0.5`}>
                                <Icon name={ev.icon} className="text-lg" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start gap-2 mb-0.5">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{ev.title}</p>
                                    <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">{ev.time}</p>
                                </div>
                                <p className="text-[11px] font-medium text-slate-500 leading-snug">{ev.desc}</p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                    
                    <button onClick={() => navigate('/schedule')} className="w-full mt-5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5">
                      Tới trang Schedule Planner <Icon name="arrow_forward" className="text-[14px]" />
                    </button>
                  </section>

                </div>
              </div>
            )}
          </main>
      </div>
    </Layout>
  );
};

export default ProfilePage;