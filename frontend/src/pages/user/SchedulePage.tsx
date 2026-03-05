import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  time: string;
  title: string;
  sub: string;
  type: 'meal' | 'workout' | 'rest';
  active?: boolean;
}

interface DayColumn {
  day: string;
  date: number;
  isToday?: boolean;
  total: string;
  totalColor?: string;
  events: CalendarEvent[];
}

interface Task {
  id: number;
  label: string;
  sub: string;
  done: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const EventCard = ({ event }: { event: CalendarEvent }) => {
  const styles = {
    meal: 'bg-white dark:bg-slate-800 border-l-4 border-primary',
    workout: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500',
    rest: 'bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700',
  };
  const timeColor = {
    meal: 'text-slate-400',
    workout: 'text-blue-400',
    rest: '',
  };

  if (event.type === 'rest') {
    return (
      <div className={`${styles.rest} p-2 rounded flex flex-col items-center justify-center py-6`}>
        <Icon name="spa" className="text-slate-400" />
        <p className="text-xs font-bold text-slate-500 mt-1">Rest Day</p>
      </div>
    );
  }

  return (
    <div
      className={`${styles[event.type]} p-2 rounded shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-shadow ${
        event.active ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-900' : ''
      } ${event.type === 'workout' && !event.active ? 'opacity-60' : ''}`}
    >
      <p className={`text-[10px] font-mono mb-0.5 ${timeColor[event.type]}`}>{event.time}</p>
      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{event.title}</h4>
      <p className="text-[10px] text-slate-500">{event.sub}</p>
    </div>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const DAYS: DayColumn[] = [
  {
    day: 'Mon', date: 23, total: 'Total: 2450 kcal',
    events: [
      { time: '08:00 AM', title: 'Oatmeal & Berries', sub: '350 kcal', type: 'meal' },
      { time: '17:00 PM', title: 'Push Day', sub: 'Chest & Triceps', type: 'workout' },
    ],
  },
  {
    day: 'Tue', date: 24, total: 'Total: 2200 kcal',
    events: [
      { time: '12:30 PM', title: 'Grilled Chicken Salad', sub: '450 kcal', type: 'meal' },
      { time: '07:00 AM', title: 'Cardio & Core', sub: 'HIIT - 30m', type: 'workout' },
    ],
  },
  {
    day: 'Wed', date: 25, isToday: true, total: 'Total: 1800/2500 kcal', totalColor: 'text-primary font-bold',
    events: [
      { time: '08:00 AM', title: 'Avocado Toast', sub: '400 kcal', type: 'meal' },
      { time: '13:00 PM', title: 'Salmon & Quinoa', sub: '550 kcal', type: 'meal', active: true },
      { time: '18:00 PM', title: 'Pull Day', sub: 'Back & Biceps', type: 'workout' },
    ],
  },
  {
    day: 'Thu', date: 26, total: 'Total: 2100 kcal',
    events: [
      { time: '', title: '', sub: '', type: 'rest' },
      { time: '19:00 PM', title: 'Lean Beef Stir-fry', sub: '600 kcal', type: 'meal' },
    ],
  },
  {
    day: 'Fri', date: 27, total: 'Total: 2600 kcal',
    events: [
      { time: '07:00 AM', title: 'Leg Day', sub: 'Squats & Lunges', type: 'workout' },
    ],
  },
  {
    day: 'Sat', date: 28, total: 'Total: 2800 kcal',
    events: [
      { time: '10:00 AM', title: 'Active Recovery', sub: 'Yoga / Stretching', type: 'workout' },
      { time: '20:00 PM', title: 'Cheat Meal', sub: 'Pizza Night', type: 'meal' },
    ],
  },
  {
    day: 'Sun', date: 29, total: 'Total: 2300 kcal',
    events: [
      { time: '11:00 AM', title: 'Brunch', sub: 'Eggs Benedict', type: 'meal' },
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const SchedulePage = () => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const location = useLocation();
  const navigate = useNavigate();

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const displayName = parsedUser?.profile?.full_name || 'User';

  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, label: 'Prepare Meals for tomorrow', sub: 'Due by 8:00 PM', done: false },
    { id: 2, label: 'Log water intake (2L)', sub: 'Completed', done: true },
    { id: 3, label: 'Update weight stats', sub: 'Weekly check-in', done: false },
  ]);

  const toggleTask = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

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
              {[
                { icon: 'grid_view', label: 'Overview', path: '/overview' },
                { icon: 'person_edit', label: 'Profile Settings', path: '/profile' },
                { icon: 'ads_click', label: 'Fitness Goals', path: '/fitness-goals' },
                { icon: 'analytics', label: 'Assessments' },
                { icon: 'calendar_month', label: 'Schedules', path: '/schedule' },
              ].map(({ icon, label, path }) => {
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
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Weekly Adherence
              </p>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[85%] rounded-full" />
              </div>
              <p className="text-[10px] mt-2 text-slate-500">
                85% of planned activities completed
              </p>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
            <div className="flex flex-col h-full gap-6">

              {/* Page Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Training &amp; Meal Schedule
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Manage your weekly routine with AI-optimized timings.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {(['week', 'month'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors capitalize ${
                          view === v
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                        }`}
                      >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                    <Icon name="add" className="text-sm" />
                    Add Event
                  </button>
                </div>
              </div>

              {/* Calendar + Sidebar */}
              <div className="flex flex-col lg:flex-row gap-6 h-full">

                {/* ── Calendar Grid ── */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">

                  {/* Calendar Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                        <Icon name="chevron_left" />
                      </button>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        October 23 – 29, 2023
                      </h2>
                      <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                        <Icon name="chevron_right" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Workout
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" /> Meal
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Rest
                      </div>
                    </div>
                  </div>

                  {/* Calendar Body */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="min-w-[800px] h-full flex flex-col">

                      {/* Day headers */}
                      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        {DAYS.map(({ day, date, isToday }) => (
                          <div
                            key={day}
                            className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
                              isToday ? 'bg-primary/5' : ''
                            }`}
                          >
                            <span className={`block text-xs font-medium uppercase ${isToday ? 'text-primary font-bold' : 'text-slate-500'}`}>
                              {day}
                            </span>
                            <span className={`block text-lg font-bold ${isToday ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                              {date}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Day columns */}
                      <div className="grid grid-cols-7 flex-1 min-h-[500px]">
                        {DAYS.map(({ day, isToday, total, totalColor, events }) => (
                          <div
                            key={day}
                            className={`border-r border-slate-200 dark:border-slate-800 last:border-r-0 p-2 space-y-2 relative group transition-colors ${
                              isToday ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            {!isToday && (
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none border-2 border-primary/20 transition-opacity" />
                            )}
                            {events.map((event, i) => (
                              <EventCard key={i} event={event} />
                            ))}
                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                              <p className={`text-[10px] ${totalColor ?? 'text-slate-400'}`}>
                                {total}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="w-full lg:w-80 flex flex-col gap-6">

                  {/* Google Calendar Sync */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Icon name="calendar_month" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          Google Calendar
                        </h3>
                        <p className="text-xs text-slate-500">Sync your workouts</p>
                      </div>
                    </div>
                    <button className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-2">
                      <Icon name="sync" className="text-lg" />
                      Sync Now
                    </button>
                  </div>

                  {/* Upcoming Tasks */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">Upcoming Tasks</h3>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500 font-bold">
                        {tasks.filter((t) => !t.done).length}
                      </span>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex gap-3 items-start">
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleTask(task.id)}
                              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${task.done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                              {task.label}
                            </p>
                            <p className={`text-xs mt-1 ${task.done ? 'text-slate-400' : 'text-slate-500'}`}>
                              {task.sub}
                            </p>
                          </div>
                        </div>
                      ))}
                      <button className="w-full text-left text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mt-2">
                        <Icon name="add" className="text-sm" />
                        Add new task
                      </button>
                    </div>
                  </div>

                  {/* Weekly Goal */}
                  <div className="bg-primary text-slate-900 rounded-xl p-6 shadow-lg shadow-primary/20">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold">Weekly Goal</h3>
                      <span className="material-symbols-outlined bg-white/20 p-1.5 rounded-lg">flag</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Workouts', value: '3/5', width: 'w-3/5' },
                        { label: 'Calories', value: '92%', width: 'w-[92%]' },
                      ].map(({ label, value, width }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>{label}</span>
                            <span>{value}</span>
                          </div>
                          <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                            <div className={`h-full bg-slate-900 ${width} rounded-full`} />
                          </div>
                        </div>
                      ))}
                    </div>
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

export default SchedulePage;