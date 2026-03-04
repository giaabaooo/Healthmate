import { useState } from 'react';
import Layout from '../components/Layout';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const SESSION_LOGS = [
  {
    day: 'Today', time: '08:15 AM', title: 'Morning Strength Training',
    meta: '45 mins • 8 Exercises', tags: ['Bench Press', 'Squats', '+6 more'],
    active: true, opacity: 'opacity-100',
  },
  {
    day: 'Yesterday', time: '06:00 PM', title: 'HIIT & Cardio Blast',
    meta: '30 mins • 5 Exercises', tags: ['Burpees', 'Sprints'],
    active: false, opacity: 'opacity-100',
  },
  {
    day: 'Oct 24', time: '07:30 AM', title: 'Yoga & Mobility',
    meta: '60 mins • Flow', tags: [],
    active: false, opacity: 'opacity-80',
  },
  {
    day: 'Oct 23', time: '05:15 PM', title: 'Lower Body Power',
    meta: '50 mins • 10 Exercises', tags: [],
    active: false, opacity: 'opacity-60',
  },
];

const MEASUREMENTS = [
  { label: 'Waist',      value: '82.4 cm', change: '-3.2 cm' },
  { label: 'Chest',      value: '104.5 cm', change: '+2.1 cm' },
  { label: 'Arms (L/R)', value: '38.2 cm', change: '+0.8 cm' },
  { label: 'Hips',       value: '94.1 cm', change: '-1.4 cm' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const TrackingPage = () => {
  const [chartRange, setChartRange] = useState<'6M' | '1Y' | 'ALL'>('6M');

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex flex-1">

          {/* ── Sidebar ── */}
          <aside className="w-64 border-r border-primary/5 bg-white dark:bg-slate-900 p-6 flex-col gap-6 hidden xl:flex">
            <div className="flex flex-col gap-1">
              <h3 className="text-slate-900 dark:text-white font-bold">Alex Johnson</h3>
              <p className="text-primary text-xs font-semibold uppercase tracking-wider">
                Premium Member
              </p>
            </div>

            <nav className="flex flex-col gap-2">
              {[
                { icon: 'grid_view',      label: 'Overview' },
                { icon: 'person_edit',    label: 'Profile Settings' },
                { icon: 'ads_click',      label: 'Fitness Goals' },
                { icon: 'analytics',      label: 'Assessments', active: true },
                { icon: 'calendar_month', label: 'Schedules' },
              ].map(({ icon, label, active }) => (
                <button
                  key={label}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    active
                      ? 'bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon name={icon} className="text-lg" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Daily Progress
              </p>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[65%] rounded-full" />
              </div>
              <p className="text-[10px] mt-2 text-slate-500">65% of your daily goal achieved</p>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 p-8">
            <div className="flex flex-col md:flex-row gap-8 w-full">

              {/* ── Left Column: Session Log ── */}
              <div className="w-full md:w-1/4 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-[750px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Session Log</h3>
                    <Icon name="filter_list" className="text-slate-400 cursor-pointer" />
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                    {SESSION_LOGS.map(({ day, time, title, meta, tags, active, opacity }) => (
                      <div
                        key={title}
                        className={`p-4 rounded-lg hover:shadow-md transition-shadow ${opacity} ${
                          active
                            ? 'bg-slate-50 dark:bg-slate-800 border-l-4 border-primary'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-primary' : 'text-slate-500'}`}>
                            {day}
                          </span>
                          <span className="text-[10px] text-slate-500">{time}</span>
                        </div>
                        <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">{title}</h4>
                        <p className="text-xs text-slate-500 mb-3">{meta}</p>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tags.map((tag) => (
                              <span key={tag} className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button className="mt-4 w-full py-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                    View All History
                    <Icon name="arrow_forward" className="text-sm" />
                  </button>
                </div>
              </div>

              {/* ── Center Column: KPI + Chart ── */}
              <div className="flex-1 flex flex-col gap-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3 rounded-xl p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Icon name="local_fire_department" className="text-primary" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                        Total Calories Burned
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-slate-900 dark:text-white tracking-tight text-4xl font-black">42,500</p>
                      <p className="text-slate-500 text-lg font-medium">kcal</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="trending_up" className="text-primary text-sm" />
                      <p className="text-primary text-sm font-bold">+12% from last month</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Icon name="scale" className="text-blue-500" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                        Current Body Weight
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-slate-900 dark:text-white tracking-tight text-4xl font-black">78.5</p>
                      <p className="text-slate-500 text-lg font-medium">kg</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="trending_down" className="text-primary text-sm" />
                      <p className="text-primary text-sm font-bold">-2.4% total loss</p>
                    </div>
                  </div>
                </div>

                {/* Progress Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 flex-1 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Weight &amp; Body Fat Progress
                      </h2>
                      <p className="text-sm text-slate-500">Detailed overview for the past 6 months</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                      {(['6M', '1Y', 'ALL'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setChartRange(r)}
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                            chartRange === r
                              ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="relative w-full h-80 flex flex-col justify-between">
                    {/* Y-axis */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 font-bold pr-4" style={{ transform: 'translateX(-100%)' }}>
                      <span>85kg</span><span>82kg</span><span>79kg</span><span>76kg</span><span>73kg</span>
                    </div>
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="border-t border-slate-100 dark:border-slate-800 w-full" />
                      ))}
                    </div>
                    {/* SVG Lines */}
                    <div className="relative flex-1 flex items-end px-4 overflow-hidden">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                        <path d="M0,50 Q150,80 300,150 T600,220 T1000,280" fill="none" stroke="#13ec5b" strokeLinecap="round" strokeWidth="4" />
                        <path d="M0,180 Q200,200 400,280 T800,340 T1000,360" fill="none" stroke="#3b82f6" strokeDasharray="8,8" strokeLinecap="round" strokeWidth="4" />
                      </svg>
                    </div>
                    {/* X-axis */}
                    <div className="flex justify-between px-4 pt-4 text-[11px] font-bold text-slate-500">
                      {['MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'].map((m) => <span key={m}>{m}</span>)}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-6 mt-10 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-xs font-semibold">Weight (kg)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs font-semibold">Body Fat %</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Transformation + Measurements ── */}
              <div className="w-full md:w-1/4 flex flex-col gap-6">

                {/* Transformation */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-5 flex items-center justify-between text-slate-900 dark:text-white">
                    Transformation
                    <Icon name="camera_alt" className="text-primary text-xl" />
                  </h3>
                  <div className="flex flex-col gap-4">
                    {/* Before */}
                    <div className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-slate-100 dark:border-slate-800">
                      <div
                        className="h-48 w-full bg-cover bg-center transition-transform group-hover:scale-110"
                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBv680N_dRoj8sPhH0l9c9LZg-MqxFApZWNucLESP846aMqnq5fswAi1JJS2oA0OSDIRFLzt0KRDZjDUjXUau5xqHZ3QivVvAhi6MurEst1UrH0dyZB6wgANSnjhd5xQZmMqw14Dvo6YmhwyL-3tEbJebG7t3LnKOCo2JB_p1yzeyNUfZ66_lMqaZ-0ykwvQj_OXRwhls-knacUXEZNP3ygqxlK7mW1I7ZIb3p-J0wJod9rPiI-ob7LhYxJXJU6PES6HafJ_HCYOIY')" }}
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">APR 12, 2024</div>
                      <div className="absolute bottom-2 right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md">BEFORE</div>
                    </div>
                    {/* After */}
                    <div className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-primary">
                      <div
                        className="h-48 w-full bg-cover bg-center transition-transform group-hover:scale-110"
                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCSTPBMBz3r9EM9Qv2vExUe2QWBJSJyjclqM7MCCLrQ8p7WMbdGVoi_8U3Myg1SCGaAXzrumznEiL1ZN3HTKT1c7WA85oEp5bPMHkVsPCKwODv3cNQqlb51y_NzhfHSP19HfupQKkvQZV6SOP9yCEX6xSmcdkHFS93PeHzbFWa0oj7NrLehcJSUPwd7wwAlUxt5qutr46znMIXQiCXCebKAi223WcRpAFFZzwV4tsqvcwzXR9Bofm0yTxTi-ZEpBvT-YtuOQ3q9Hv8')" }}
                      />
                      <div className="absolute top-2 left-2 bg-primary text-slate-900 text-[10px] font-bold px-2 py-1 rounded-md">OCT 25, 2024</div>
                      <div className="absolute bottom-2 right-2 bg-primary text-slate-900 text-[10px] font-bold px-2 py-1 rounded-md">LATEST</div>
                    </div>
                  </div>
                  <button className="w-full mt-4 py-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    + Add New Progress Photo
                  </button>
                </div>

                {/* Body Measurements */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-5 text-slate-900 dark:text-white">Body Measurements</h3>
                  <div className="space-y-4">
                    {MEASUREMENTS.map(({ label, value, change }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon name="straighten" className="text-slate-400 text-lg" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{value}</div>
                          <div className="text-[10px] text-primary font-bold">{change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      <strong className="text-primary">Summary:</strong> You've lost significant
                      circumference in your waist while increasing muscle mass in chest and arms. Keep it up!
                    </p>
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

export default TrackingPage;