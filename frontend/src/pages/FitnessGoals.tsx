import Layout from '../components/Layout';
import { useEffect, useState } from "react";
import { getTodayProgress } from "../services/progressService";
import {
  getUserGoal,
  getMicroGoals,
  toggleMicroGoal,
  createMicroGoal,
  deleteMicroGoal,
  updateMotivation
} from "../services/goalService";
// ─── Types ───────────────────────────────────────────────────────────────────
interface MicroGoal {
  _id: string;
  goal_id?: string;
  label: string;
  done: boolean;
  week?: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const MicroGoalItem = ({
 goal,
 onToggle,
 onDelete,
}: {
 goal: MicroGoal;
 onToggle: (id: string) => void;
 onDelete: (id: string) => void;
}) => (
<div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 group">

<label className="flex items-center gap-3 cursor-pointer">
<input
type="checkbox"
checked={goal.done}
onChange={() => onDelete(goal._id)}
className="form-checkbox rounded text-primary h-5 w-5"
/>

<span
className={`text-sm font-medium ${
goal.done
? "line-through text-slate-400"
: "text-slate-900 dark:text-white"
}`}
>
{goal.label}
</span>
</label>



</div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const FitnessGoal = () => {
const [newGoal, setNewGoal] = useState("");
 const [progress, setProgress] = useState<any>(null);
const [goal, setGoal] = useState<any>(null);
const [microGoals, setMicroGoals] = useState<MicroGoal[]>([]);
const [motivation, setMotivation] = useState("");
const completed = microGoals.filter(g => g.done).length;
const total = microGoals.length;

const progressPercent = total === 0 ? 0 : (completed / total) * 100;
// load progress
useEffect(() => {
  const loadProgress = async () => {
    try {
      const data = await getTodayProgress();
      setProgress(data);
    } catch (error) {
      console.error(error);
    }
  };

  loadProgress();
}, []);


// load goals
useEffect(() => {
  const loadGoals = async () => {
    try {

      const goalData = await getUserGoal();
      console.log("goalData:", goalData);

      setGoal(goalData);

      if (goalData?.motivation) {
        setMotivation(goalData.motivation);
      }

      if (goalData?._id) {

        const micro = await getMicroGoals(goalData._id);

        console.log("micro goals:", micro);

        setMicroGoals(micro);
      }

    } catch (error) {
      console.error(error);
    }
  };

  loadGoals();
}, []);
//add Goal
const addGoal = async () => {

  if (!newGoal.trim()) return;

  try {

    const created = await createMicroGoal(goal._id, newGoal);

    setMicroGoals([...microGoals, created]);

    setNewGoal("");

  } catch (err) {
    console.error(err);
  }
};
//Xoa micro goal
const removeGoal = async (id: string) => {

  try {

    await deleteMicroGoal(id);

    setMicroGoals(microGoals.filter(g => g._id !== id));

  } catch (err) {
    console.error(err);
  }
};

  // toggle micro goal
  const toggleGoal = async (id: string) => {
    try {

      await toggleMicroGoal(id);

      setMicroGoals((prev) =>
        prev.map((g) =>
          g._id === id ? { ...g, done: !g.done } : g
        )
      );

    } catch (error) {
      console.error(error);
    }
  };

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
                { icon: 'grid_view', label: 'Overview' },
                { icon: 'person', label: 'Profile Settings' },
                { icon: 'ads_click', label: 'Fitness Goals', active: true },
                { icon: 'analytics', label: 'Assessments' },
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
              <div className="h-1.5 w -full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <p className="text-xs text-slate-500 mt-2">
 {completed} / {total} micro goals completed
</p>
                <div
  className="bg-primary h-full rounded-full"
  style={{ width: `${progressPercent}%` }}
/>
              </div>
              {progress && (
  <p className="text-[10px] mt-2 text-slate-500">
    {progress.totalWorkouts} workouts today
  </p>
)}
{progress && (
  <div className="text-sm text-slate-500">
    🔥 Calories burned: {progress.totalCalories}
  </div>
)}
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 p-8 max-w-6xl mx-auto">

            {/* Page Header */}
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Manage Goals
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Set clear objectives and track your journey to a better you.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm flex items-center gap-2">
                  <Icon name="history" className="text-base" />
                  History
                </button>
                <button className="bg-primary hover:bg-primary/90 text-slate-900 font-bold py-2 px-6 rounded-lg transition-all shadow-lg shadow-primary/20 text-sm flex items-center gap-2">
                  <Icon name="add" className="text-base" />
                  New Goal
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ── Left Column ── */}
              <div className="lg:col-span-2 flex flex-col gap-8">

                {/* Primary Goal Card */}
                <section className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
                    <Icon name="fitness_center" className="text-[120px] text-slate-100 dark:text-slate-800 rotate-12 -mr-8 -mt-8" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2.5 rounded-lg text-primary">
                          <Icon name="fitness_center" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Muscle Hypertrophy
                          </h2>
                          <p className="text-xs text-primary font-bold uppercase tracking-wider">
                            Active Primary Goal
                          </p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-primary transition-colors">
                        <Icon name="edit" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {[
                        { label: 'Goal Type', value: 'Muscle Gain', sub: '' },
                        { label: 'Duration', value: '12 Weeks', sub: 'Ends Dec 24, 2023' },
                        { label: 'Commitment', value: '4 Days / Week', sub: 'High Intensity' },
                      ].map(({ label, value, sub }) => (
                        <div key={label} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                          <p className="text-xs text-slate-500 mb-1 font-medium">{label}</p>
                          <p className="text-slate-900 dark:text-white font-bold">{value}</p>
                          {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Icon name="ads_click" className="text-primary text-lg" />
                        Target Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Target Weight', target: '88 kg', current: '84 kg' },
                          { label: 'Bench Press PR', target: '100 kg', current: '85 kg' },
                        ].map(({ label, target, current }) => (
                          <div
                            key={label}
                            className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                          >
                            <div>
                              <p className="text-xs text-slate-500">{label}</p>
                              <p className="font-bold text-slate-900 dark:text-white">{target}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Current</p>
                              <p className="font-bold text-slate-900 dark:text-white">{current}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                      <div className="flex items-start gap-3">
                        <Icon name="psychology" className="text-primary mt-1" />
                        <div className="w-full">
                          <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                            Why this goal matters
                          </p>
                          <textarea
                            rows={2}
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                            className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 resize-none border-0 p-0 focus:ring-0 placeholder:text-slate-400"
                          />
                        </div>
                        <button className="text-primary hover:text-primary/70 transition-colors">
                          <Icon name="save" className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Secondary Goals */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Icon name="directions_run" />
                      </div>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded font-medium">
                        Paused
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      Endurance Run
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Prepare for half-marathon</p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[30%]" />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-right">30% Complete</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full text-slate-400 mb-3">
                      <Icon name="add" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Add Secondary Goal
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Flexibility, hydration, or sleep</p>
                  </div>
                </section>
              </div>

              {/* ── Right Column ── */}
              <div className="flex flex-col gap-8">

                {/* Goal Timeline */}
                <section className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-16 -mb-16 blur-3xl pointer-events-none" />

                  <div className="flex items-center gap-2 mb-6 relative z-10">
                    <Icon name="timeline" className="text-primary" />
                    <h2 className="text-lg font-bold">Goal Timeline</h2>
                  </div>

                  <div className="relative pl-4 border-l-2 border-slate-700 space-y-8 z-10">
                    {[
                      {
                        phase: 'Current Phase',
                        title: 'Hypertrophy Block A',
                        desc: 'Weeks 1-4: High volume foundation.',
                        active: true,
                        opacity: 'opacity-100',
                      },
                      {
                        phase: 'Nov 15',
                        title: 'Strength Phase',
                        desc: 'Weeks 5-8: Lower reps, heavier weights.',
                        active: false,
                        opacity: 'opacity-75',
                      },
                      {
                        phase: 'Dec 10',
                        title: 'Peak Week',
                        desc: 'Testing 1RM maxes.',
                        active: false,
                        opacity: 'opacity-50',
                      },
                    ].map(({ phase, title, desc, active, opacity }) => (
                      <div key={title} className={`relative ${opacity}`}>
                        <div
                          className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-slate-900 ${
                            active ? 'bg-primary ring-2 ring-primary/50' : 'bg-slate-600'
                          }`}
                        />
                        <p className={`text-xs font-bold mb-1 ${active ? 'text-primary' : 'text-slate-400'}`}>
                          {phase}
                        </p>
                        <h4 className="text-sm font-bold text-white">{title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-8 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-all backdrop-blur-sm">
                    View Detailed Roadmap
                  </button>
                </section>

                {/* Micro Goals */}
                <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col gap-3 mb-4">

<h2 className="text-lg font-bold text-slate-900 dark:text-white">
This Week's Micro-Goals
</h2>

<div className="flex items-center gap-2 w-full">

<input
value={newGoal}
onChange={(e) => setNewGoal(e.target.value)}
onKeyDown={(e) => {
  if (e.key === "Enter") addGoal();
}}
placeholder="Add new micro goal..."
className="flex-1 min-w-0 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800"
/>

<button
onClick={addGoal}
className="shrink-0 bg-primary text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/80"
>
Add
</button>

</div>

</div>
                  <div className="space-y-1">
                  {microGoals.map(goal => (
  <MicroGoalItem
    key={goal._id}
    goal={goal}
    onToggle={toggleGoal}
    onDelete={removeGoal}
  />
))}
                  </div>
                  
                </section>

              </div>
            </div>
          </main>

        </div>
      </div>
    </Layout>
  );
};

export default FitnessGoal;