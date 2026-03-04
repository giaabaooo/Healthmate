import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Sub-components ───────────────────────────────────────────────────────────

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const OverviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const displayName = parsedUser?.profile?.full_name || 'User';

  const [todayWeight, setTodayWeight] = useState<string>('');
  const [todayHeight, setTodayHeight] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [entries, setEntries] = useState<
    { date: string; weight: number; height: number; bmi: number }[]
  >([]);

  const todayBmi =
    todayHeight && todayWeight
      ? Number(todayWeight) / Math.pow(Number(todayHeight) / 100, 2)
      : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Khôi phục lịch sử từ localStorage
    const storedHistory = localStorage.getItem('bodyCheckinHistory');
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }

    // Prefill form với số liệu sẵn có
    let baseHeight: number | undefined;
    let baseWeight: number | undefined;

    const latest = localStorage.getItem('latestBodyCheckin');
    if (latest) {
      try {
        const parsedLatest = JSON.parse(latest);
        if (typeof parsedLatest.height === 'number') baseHeight = parsedLatest.height;
        if (typeof parsedLatest.weight === 'number') baseWeight = parsedLatest.weight;
      } catch {
        // ignore
      }
    }

    if (baseHeight == null || baseWeight == null) {
      if (parsedUser?.profile) {
        if (typeof parsedUser.profile.height_cm === 'number') {
          baseHeight = parsedUser.profile.height_cm;
        }
        if (typeof parsedUser.profile.weight_kg === 'number') {
          baseWeight = parsedUser.profile.weight_kg;
        }
      }
    }

    if (!todayHeight && typeof baseHeight === 'number') {
      setTodayHeight(String(baseHeight));
    }
    if (!todayWeight && typeof baseWeight === 'number') {
      setTodayWeight(String(baseWeight));
    }
  }, [parsedUser]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!todayWeight || !todayHeight) {
      setFormError('Vui lòng nhập đầy đủ cân nặng và chiều cao.');
      return;
    }

    const weight = Number(todayWeight);
    const height = Number(todayHeight);
    // Không chấp nhận giá trị âm hoặc 0
    if (!Number.isFinite(weight) || weight <= 0) {
      setFormError('Cân nặng phải lớn hơn 0.');
      return;
    }
    if (!Number.isFinite(height) || height <= 0) {
      setFormError('Chiều cao phải lớn hơn 0.');
      return;
    }

    const bmi = weight / Math.pow(height / 100, 2);

    const today = new Date();
    const dateLabel = today.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const roundedBmi = Number(bmi.toFixed(1));

    const latestEntry = {
      date: dateLabel,
      weight,
      height,
      bmi: roundedBmi,
    };

    setEntries((prev) => {
      const next = [latestEntry, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('bodyCheckinHistory', JSON.stringify(next));
        localStorage.setItem('latestBodyCheckin', JSON.stringify(latestEntry));
      }
      return next;
    });

    // Giữ nguyên giá trị form bằng số vừa lưu (để user thấy rõ)
    setTodayWeight(String(weight));
    setTodayHeight(String(height));
    setFormError(null);
  };

  const sidebarItems = [
    { icon: 'grid_view', label: 'Overview', path: '/overview' },
    { icon: 'person_edit', label: 'Profile Settings', path: '/profile' },
    { icon: 'ads_click', label: 'Fitness Goals', path: '/fitness-goals' },
    // Tạm thời cho Assessments quay về overview để tránh 404,
    // sau này có trang riêng thì chỉ cần đổi path ở đây.
    { icon: 'analytics', label: 'Assessments', path: '/overview' },
    { icon: 'calendar_month', label: 'Schedules', path: '/schedule' },
  ] as const;

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex flex-1">

          {/* ── Sidebar ── */}
          <aside className="w-64 border-r border-primary/5 bg-white dark:bg-slate-900 p-6 flex-col gap-6 hidden xl:flex">
            <div className="flex flex-col gap-1">
              <h3 className="text-slate-900 dark:text-white font-bold">{displayName}</h3>
              <p className="text-primary text-xs font-semibold uppercase tracking-wider">
                Premium Member
              </p>
            </div>

            <nav className="flex flex-col gap-2">
              {sidebarItems.map(({ icon, label, path }) => {
                const isActive = path ? location.pathname === path : false;
                const isClickable = Boolean(path);

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => path && navigate(path)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    } ${!isClickable ? 'cursor-default' : ''}`}
                  >
                    <Icon name={icon} className="text-lg" />
                    <span className="text-sm">{label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Daily Progress</p>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[75%] rounded-full" />
              </div>
              <p className="text-[10px] mt-2 text-slate-500">75% of your daily goal achieved</p>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 p-8">

            {/* Personalized Greeting */}
            <div className="mb-10">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return `Good Morning, ${displayName}!`;
                  if (hour < 18) return `Good Afternoon, ${displayName}!`;
                  return `Good Evening, ${displayName}!`;
                })()}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                You're <span className="text-primary font-bold">75%</span> of the way to your daily goal. Keep it up!
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <span className="material-symbols-outlined">local_fire_department</span>
                  </div>
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Calories Burned</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">1,840</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">kcal</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>+12% from yesterday</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <span className="material-symbols-outlined">directions_walk</span>
                  </div>
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Steps Taken</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">8,245</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">/ 10,000</span>
                </div>
                <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[82%] rounded-full" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <span className="material-symbols-outlined">water_drop</span>
                  </div>
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Water Intake</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">1.5</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">/ 2.5 Liters</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-red-500 font-bold text-sm">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span>-0.4L below target</span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Daily Body Metrics Form - center main column */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">monitor_heart</span>
                      Daily Body Check-in
                    </h3>
                  </div>

                  <form onSubmit={handleAddEntry} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                          Cân nặng (kg)
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={300}
                          step="0.1"
                          value={todayWeight}
                          onChange={(e) => setTodayWeight(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none"
                          placeholder="Ví dụ 70"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                          Chiều cao (cm)
                        </label>
                        <input
                          type="number"
                          min={50}
                          max={250}
                          value={todayHeight}
                          onChange={(e) => setTodayHeight(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none"
                          placeholder="Ví dụ 170"
                          required
                        />
                      </div>
                    </div>

                    {formError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {formError}
                      </p>
                    )}

                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800 px-4 py-3">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          BMI hôm nay
                        </p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">
                          {todayBmi ? todayBmi.toFixed(1) : '—'}
                        </p>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-slate-900 shadow-md shadow-primary/30 hover:bg-primary/90 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Lưu hôm nay
                      </button>
                    </div>
                  </form>

                  {entries.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Lịch sử gần đây
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {entries.map((entry, idx) => (
                          <div
                            key={`${entry.date}-${idx}`}
                            className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                          >
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {entry.date}
                              </p>
                              <p className="text-slate-500">
                                {entry.weight} kg • {entry.height} cm
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                BMI
                              </p>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {entry.bmi.toFixed(1)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Next Workout Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 group">
                  <div className="absolute top-0 right-0 w-1/2 h-full">
                    <img
                      alt="Next Workout"
                      className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBryS_rxmaZ9XU3n6odD4IxFFl5h_0A8FBG6WzcT0_QlhVhWP7nbgh3VzFFQoaBhxJPLa-r2FD1IA83drYxaNlFFgbn-V5tfoG9VhKPtjoXtwyg4tVaytbLvv3p6gCS9FslofRpiiZtuWIOVQkA_ddXUbpJPHYt8e5byTOhZZnzjvebKiGOQPIWAYOE6qP99IzVo3oVCGJpaDwt-VwCoxaL2Nqc6wzO3jfmfNn-B02NpStIglErwQkf_rxxAYvBvhyjo74rNP1IUrs"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900" />
                  </div>
                  <div className="relative z-10 max-w-sm">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Upcoming Today
                    </div>
                    <h3 className="text-3xl font-black mb-2">High Intensity Upper Body</h3>
                    <p className="text-slate-400 mb-6">Level: Advanced • 45 Minutes • Burn ~450 kcal</p>
                    <div className="flex gap-4">
                      <button className="bg-primary text-background-dark font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined">play_arrow</span>
                        Start Session
                      </button>
                      <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Community Highlights */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Community Highlights</h3>
                    <a className="text-primary text-sm font-bold hover:underline" href="#">See all activity</a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-4">
                      <img alt="User Avatar" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPbHZ-gk49Pmu4-TZFiJ_44LzM0H4jeO1RdRy6-_3QJ509JHBF1ozN_22XyfTp9KGlQ0O0-ZVAjM-aJl3RdkwkTpB5DUifTdF5oXEu2HWtziX8QAZJYBKsfRw4ri2iknL5OyVuBYt5Qstgs3N51kZ-8HBUrdtz41tOVAipQDM5YZHWuw9AlOKSKUkkHwJVvUbIAK0OobwUHwEIvnAqmJYesBDcx7-bkQsWZySJcKPS_2y46F2I-_yOKxX3qhfWYtH4m2eT5R1uf54" />
                      <div>
                        <p className="text-sm text-slate-900 dark:text-white font-bold">Sarah J. <span className="font-normal text-slate-500">just hit a 30-day streak!</span></p>
                        <p className="text-xs text-slate-400 mt-1">2 mins ago • Consistency Queen</p>
                        <div className="flex gap-1 mt-2">
                          <button className="text-primary text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">thumb_up</span> 14
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-4">
                      <img alt="User Avatar" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyipyg84YiYY6pnwWMJMB0Jlfbf3CHeU6l6mYQwUPiC5O08JFO1rED4xYwYDvLLOaUJxrDLigIvryVId_8mYierLNvAsxnGDbFBA6EA2GGVY8tO7hZgeOLl3LkBBccO6TuBy7bKwEgFUv4-5BeRn0UCQ8FLeNBN03rIEzVCcDKas7skyBd9OeGT_vv-N6CH2HUS6OB3RDZqwm_1H61HGc8_OCPGKrC7DH0pzE7B5KnrsWcNcpaHbZ9uUSLD05EvSolRuXev8Oryn8" />
                      <div>
                        <p className="text-sm text-slate-900 dark:text-white font-bold">Mike Chen <span className="font-normal text-slate-500">shared a new 'Quinoa Salad' recipe.</span></p>
                        <p className="text-xs text-slate-400 mt-1">15 mins ago • Nutrition Hub</p>
                        <div className="flex gap-1 mt-2">
                          <button className="text-primary text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">chat</span> 8 comments
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-8">
                {/* AI Suggested Meal */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">restaurant_menu</span>
                        AI Suggested Lunch
                      </h3>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined">refresh</span>
                      </button>
                    </div>
                    <div className="rounded-2xl overflow-hidden h-40 mb-4">
                      <img
                        alt="Meal suggestion"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKB4k09hwtzgYnIoCOXhszCLZX7mAMZErFxItZrWXJ_kVkE5rdoGdiBHJP7SsPsr7aHEKvXxHNMBRvno0yqoi9XMYlC4YSbkQxKR53xLkXQXQQcBdyCFEj9i_CcGWhX95rnPcMDQU7iFV4TfkdqLCKvd3frdjm_pCLz-j9lPPrRLBP34OvMBti1yZP_P5FCbw1hHNjHP4sObqaCFSCRpChQzbZiWwwDvbL-fR-a0AWfQu3H0uiBTv-z3xtuZzKbTCmo78OU-ogQ6c"
                      />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Avocado Buddha Bowl</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Rich in healthy fats and proteins to keep you energized for your afternoon workout.
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {[
                        { label: 'Protein', value: '24g' },
                        { label: 'Carbs', value: '45g' },
                        { label: 'Fats', value: '18g' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{label}</p>
                          <p className="font-bold text-slate-900 dark:text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full border-2 border-primary text-slate-900 dark:text-white font-bold py-3 rounded-xl hover:bg-primary transition-all">
                      Add to Journal
                    </button>
                  </div>
                </div>

                {/* Weekly Performance */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white">Weekly Performance</h3>
                    <select className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0">
                      <option>This Week</option>
                      <option>Last Week</option>
                    </select>
                  </div>
                  <div className="h-40 flex items-end justify-between gap-2 px-2">
                    {[
                      { h: '40%', bg: 'bg-primary/20', tooltip: 'Mon: 1.2k' },
                      { h: '65%', bg: 'bg-primary/20', tooltip: 'Tue: 1.8k' },
                      { h: '85%', bg: 'bg-primary/20', tooltip: 'Wed: 2.1k' },
                      { h: '75%', bg: 'bg-primary', tooltip: 'Thu (Today): 1.9k' },
                      { h: '20%', bg: 'bg-slate-200 dark:bg-slate-800', tooltip: 'Fri' },
                      { h: '20%', bg: 'bg-slate-200 dark:bg-slate-800', tooltip: 'Sat' },
                      { h: '20%', bg: 'bg-slate-200 dark:bg-slate-800', tooltip: 'Sun' },
                    ].map(({ h, bg, tooltip }) => (
                      <div key={tooltip} className={`w-full ${bg} rounded-t-lg group relative`} style={{ height: h }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {tooltip}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>M</span><span>T</span><span>W</span>
                    <span className="text-primary">T</span>
                    <span>F</span><span>S</span><span>S</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

        </div>
      </div>
    </Layout>
  );
};

export default OverviewPage; 