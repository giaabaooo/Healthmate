import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

interface Profile {
  full_name?: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  goal?: 'muscle_gain' | 'fat_loss' | 'maintain';
}

interface UserResponse {
  _id: string;
  email: string;
  role: string;
  profile?: Profile;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [gender, setGender] = useState<Profile['gender'] | ''>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [goal, setGoal] = useState<Profile['goal'] | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [latestCheckin, setLatestCheckin] = useState<{
    height: number;
    weight: number;
    bmi: number;
  } | null>(null);

  const bmiHeight =
    latestCheckin?.height ?? (height ? Number(height) : undefined);
  const bmiWeight =
    latestCheckin?.weight ?? (weight ? Number(weight) : undefined);

  const displayHeight = bmiHeight;
  const displayWeight = bmiWeight;
  const displayName = user?.profile?.full_name || 'User';

  const bmi =
    bmiHeight && bmiWeight
      ? (bmiWeight / Math.pow(bmiHeight / 100, 2)).toFixed(1)
      : null;

  const getBmiLabel = (bmiVal: number) => {
    if (bmiVal < 18.5) return 'Thiếu cân';
    if (bmiVal < 25) return 'Bình thường';
    if (bmiVal < 30) return 'Thừa cân';
    return 'Béo phì';
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const isGoogle = localStorage.getItem('isGoogleLogin');

    // Nếu đăng nhập bằng Google (Mock), KHÔNG gọi API Backend để tránh bị lỗi 401
    if (isGoogle === 'true') {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        setUser(parsedUser);
        setGender(parsedUser.profile?.gender || '');
        setHeight(parsedUser.profile?.height_cm ? String(parsedUser.profile.height_cm) : '');
        setWeight(parsedUser.profile?.weight_kg ? String(parsedUser.profile.weight_kg) : '');
        setGoal(parsedUser.profile?.goal || '');

        const latest = localStorage.getItem('latestBodyCheckin');
        if (latest) {
          try {
            const parsed = JSON.parse(latest);
            if (
              typeof parsed.height === 'number' &&
              typeof parsed.weight === 'number' &&
              typeof parsed.bmi === 'number'
            ) {
              setLatestCheckin({
                height: parsed.height,
                weight: parsed.weight,
                bmi: parsed.bmi,
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
      setLoading(false);
      return; 
    }

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
        setGender((data.profile?.gender as Profile['gender']) || '');
        setHeight(
          typeof data.profile?.height_cm === 'number'
            ? String(data.profile.height_cm)
            : ''
        );
        setWeight(
          typeof data.profile?.weight_kg === 'number'
            ? String(data.profile.weight_kg)
            : ''
        );
        setGoal((data.profile?.goal as Profile['goal']) || '');

        const latest = localStorage.getItem('latestBodyCheckin');
        if (latest) {
          try {
            const parsed = JSON.parse(latest);
            if (
              typeof parsed.height === 'number' &&
              typeof parsed.weight === 'number' &&
              typeof parsed.bmi === 'number'
            ) {
              setLatestCheckin({
                height: parsed.height,
                weight: parsed.weight,
                bmi: parsed.bmi,
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      } catch {
        setError('Có lỗi xảy ra khi kết nối tới server.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-64 border-r border-primary/5 bg-white dark:bg-slate-900 p-6 flex-col gap-6 hidden xl:flex">
            <div className="flex flex-col gap-1">
              <h3 className="text-slate-900 dark:text-white font-bold">
                {displayName}
              </h3>
              <p className="text-primary text-xs font-semibold uppercase tracking-wider">
                Premium Member
              </p>
            </div>
            <nav className="flex flex-col gap-2">
              {[
                { icon: 'grid_view', label: 'Overview', path: '/overview' },
                { icon: 'person_edit', label: 'Profile Settings', path: '/profile' },
                { icon: 'ads_click', label: 'Fitness Goals', path: '/fitness-goals' },
                { icon: 'analytics', label: 'Assessments' },
                { icon: 'calendar_month', label: 'Schedules', path: '/schedule' },
              ].map(({ icon, label, path }) => {
                const isActive = path ? location.pathname === path : false;

                if (!path) {
                  return (
                    <div
                      key={label}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 cursor-default"
                    >
                      <span className="material-symbols-outlined text-lg">{icon}</span>
                      <span className="text-sm">{label}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={label}
                    to={path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                    <span className="text-sm">{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Daily Progress
              </p>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[65%] rounded-full" />
              </div>
              <p className="text-[10px] mt-2 text-slate-500">
                65% of your daily goal achieved
              </p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-start gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  User Profile &amp; Goals
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">
                  Cập nhật thông tin cơ bản để HealthMate cá nhân hóa gợi ý tập luyện và
                  dinh dưỡng.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Đăng xuất
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Đang tải thông tin hồ sơ...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                  <section className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-primary">badge</span>
                      <h2 className="text-xl font-bold">Personal Details</h2>
                    </div>

                    {error && (
                      <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {error}
                      </div>
                    )}
                    {user && (
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm mb-6">
                        <p>
                          <span className="font-medium">Email:</span> {user.email}
                        </p>
                        <p>
                          <span className="font-medium">Vai trò:</span>{' '}
                          {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        </p>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Họ và tên
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {displayName || '—'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Email
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {user?.email || '—'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Chiều cao
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {typeof displayHeight === 'number'
                              ? `${displayHeight} cm`
                              : '—'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Cân nặng
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {typeof displayWeight === 'number'
                              ? `${displayWeight} kg`
                              : '—'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Giới tính
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {gender === 'male'
                              ? 'Nam'
                              : gender === 'female'
                              ? 'Nữ'
                              : gender === 'other'
                              ? 'Khác'
                              : '—'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Mục tiêu
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {goal === 'muscle_gain'
                              ? 'Tăng cơ'
                              : goal === 'fat_loss'
                              ? 'Giảm mỡ'
                              : goal === 'maintain'
                              ? 'Duy trì'
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-8">
                  {/* BMI Card - tính động */}
                  <section className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="flex items-center gap-2 mb-6">
                      <span className="material-symbols-outlined text-primary">analytics</span>
                      <h2 className="text-lg font-bold">Chỉ số sức khỏe</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-center">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">
                          BMI
                        </p>
                        <p className="text-2xl font-black text-primary">
                          {bmi ?? '—'}
                        </p>
                        <p className="text-[10px] text-slate-300 mt-1">
                          {bmi ? getBmiLabel(Number(bmi)) : 'Chưa có dữ liệu'}
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-center">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">
                          Mục tiêu
                        </p>
                        <p className="text-lg font-black text-primary leading-tight mt-1">
                          {goal === 'muscle_gain'
                            ? 'Tăng cơ'
                            : goal === 'fat_loss'
                            ? 'Giảm mỡ'
                            : goal === 'maintain'
                            ? 'Duy trì'
                            : '—'}
                        </p>
                      </div>
                    </div>
                    {typeof displayHeight === 'number' &&
                      typeof displayWeight === 'number' && (
                      <div className="mt-6 text-xs text-slate-400 text-center">
                        {displayHeight} cm · {displayWeight} kg
                      </div>
                    )}
                  </section>

                  {/* Today's Plan */}
                  <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          Today's Plan
                        </h2>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Hôm nay</span>
                    </div>
                    <div className="space-y-4">
                      {[
                        {
                          icon: 'restaurant',
                          color: 'border-primary text-primary',
                          title: 'Keto Lunch',
                          desc: 'Chicken breast with roasted broccoli',
                          sub: '450 kcal',
                          subColor: 'text-primary',
                        },
                        {
                          icon: 'exercise',
                          color: 'border-blue-500 text-blue-500',
                          title: 'Upper Body Power',
                          desc: 'Strength Training • 45 min',
                          sub: 'Gym Access Required',
                          subColor: 'text-blue-500',
                        },
                        {
                          icon: 'nutrition',
                          color: 'border-orange-400 text-orange-400',
                          title: 'Recovery Shake',
                          desc: 'Whey protein with almond milk',
                          sub: '',
                          subColor: '',
                        },
                      ].map(({ icon, color, title, desc, sub, subColor }) => (
                        <div
                          key={title}
                          className={`flex items-start gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border-l-4 ${color.split(' ')[0]}`}
                        >
                          <div className={`${color.split(' ')[1]} mt-0.5`}>
                            <span className="material-symbols-outlined text-lg">{icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {title}
                            </p>
                            <p className="text-xs text-slate-500">{desc}</p>
                            {sub && (
                              <p className={`text-[10px] font-semibold mt-1 ${subColor}`}>
                                {sub}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-6 py-3 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      View Full Calendar
                    </button>
                  </section>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;