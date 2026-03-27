import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface User {
  _id: string;
  email: string;
  profile: { full_name: string };
}

interface MealItem {
  _id: string;
  food_id: string;
  name: string;
  quantity: number;
  calories: number;
}

interface Food {
  _id: string;
  name: string;
  category: string;
  calories: number;
}

interface MealPlannerSectionProps {
  onBack: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast',  time: '06:00–09:00', color: '#f59e0b' },
  { key: 'lunch',     label: 'Lunch',      time: '11:00–13:00', color: '#60a5fa' },
  { key: 'dinner',    label: 'Dinner',     time: '17:00–20:00', color: '#a78bfa' },
  { key: 'snack',     label: 'Snack',      time: 'Other',       color: '#4ade80' },
] as const;
type MealSlotKey = typeof MEAL_SLOTS[number]['key'];

const CALORIE_GOAL = 2000;
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Helpers ──────────────────────────────────────────────────────────────────

const offsetDate = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });

const buildWeekDates = (anchor: string): string[] =>
  Array.from({ length: 7 }, (_, i) => offsetDate(anchor, i - 6));

// Assign items round-robin to meal slots (same logic as customer page)
const groupBySlot = (items: MealItem[]): Record<MealSlotKey, MealItem[]> => {
  const g: Record<MealSlotKey, MealItem[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  items.forEach((item, i) => { g[MEAL_SLOTS[i % 4].key].push(item); });
  return g;
};

// ── Component ────────────────────────────────────────────────────────────────

const MealPlannerSection: React.FC<MealPlannerSectionProps> = ({ onBack }) => {
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<MealItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<Record<string, number>>({});

  // Food modal state
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Inline edit state
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchMealPlan(); }, [selectedDate, targetUserId]);
  useEffect(() => { fetchWeeklyData(); }, [selectedDate, targetUserId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('https://healthmate-y9vt.onrender.com/api/users', { headers: authHeaders() });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      const q = targetUserId ? `?target_user_id=${targetUserId}` : '';
      const res = await fetch(`https://healthmate-y9vt.onrender.com/api/meal-plans/${selectedDate}${q}`, { headers: authHeaders() });
      const data = await res.json();
      setItems(data.items || []);
      setTotalCalories(data.total_calories || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchWeeklyData = async () => {
    const week = buildWeekDates(selectedDate);
    const results: Record<string, number> = {};
    await Promise.all(week.map(async (date) => {
      try {
        const q = targetUserId ? `?target_user_id=${targetUserId}` : '';
        const res = await fetch(`https://healthmate-y9vt.onrender.com/api/meal-plans/${date}${q}`, { headers: authHeaders() });
        const data = await res.json();
        results[date] = data.total_calories || 0;
      } catch { results[date] = 0; }
    }));
    setWeeklyData(results);
  };

  const fetchFoods = async () => {
    try {
      const res = await fetch('https://healthmate-y9vt.onrender.com/api/foods');
      const data = await res.json();
      setFoods(data);
      const init: Record<string, number> = {};
      data.forEach((f: Food) => { init[f._id] = 100; });
      setQuantities(init);
    } catch (e) { console.error(e); }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const openFoodModal = () => {
    fetchFoods();
    setFoodSearch('');
    setFoodCategory('');
    setShowFoodModal(true);
  };

  const addFood = async (foodId: string) => {
    const quantity = quantities[foodId] || 100;
    try {
      const body: Record<string, unknown> = { food_id: foodId, quantity };
      if (targetUserId) body.target_user_id = targetUserId;
      const res = await fetch(`https://healthmate-y9vt.onrender.com/api/meal-plans/${selectedDate}/items`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) { toast.success('Added to meal plan'); fetchMealPlan(); setShowFoodModal(false); }
      else { const d = await res.json(); toast.error(d.message || 'Error adding food'); }
    } catch { toast.error('Connection error'); }
  };

  const updateQuantity = async (itemId: string) => {
    if (editQuantity <= 0 || editQuantity > 5000) { toast.error('Quantity must be 1–5000g'); return; }
    try {
      const body: Record<string, unknown> = { quantity: editQuantity };
      if (targetUserId) body.target_user_id = targetUserId;
      const res = await fetch(`https://healthmate-y9vt.onrender.com/api/meal-plans/${selectedDate}/items/${itemId}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) { toast.success('Updated'); fetchMealPlan(); setEditingItem(null); }
    } catch { toast.error('Connection error'); }
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;
    try {
      const q = targetUserId ? `?target_user_id=${targetUserId}` : '';
      const res = await fetch(
        `https://healthmate-y9vt.onrender.com/api/meal-plans/${selectedDate}/items/${deleteTarget.id}${q}`,
        { method: 'DELETE', headers: authHeaders() },
      );
      if (res.ok) { toast.success('Removed'); fetchMealPlan(); }
    } catch { toast.error('Connection error'); }
    finally { setDeleteTarget(null); }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedUser = users.find(u => u._id === targetUserId);
  const targetName = selectedUser?.profile.full_name ?? 'Admin';
  const caloriePercent = Math.min(100, Math.round((totalCalories / CALORIE_GOAL) * 100));
  const calorieRemain = Math.max(0, CALORIE_GOAL - totalCalories);
  const ringColor = caloriePercent >= 100 ? '#ef4444' : caloriePercent >= 75 ? '#f59e0b' : '#13ec5b';
  const barColor = caloriePercent >= 100 ? 'bg-red-500' : caloriePercent >= 75 ? 'bg-yellow-400' : 'bg-primary';

  const grouped = groupBySlot(items);
  const estCarb    = Math.round((totalCalories * 0.50) / 4);
  const estProtein = Math.round((totalCalories * 0.25) / 4);
  const estFat     = Math.round((totalCalories * 0.25) / 9);

  const weekDates = buildWeekDates(selectedDate);
  const weekMax = Math.max(...weekDates.map(d => weeklyData[d] || 0), CALORIE_GOAL);

  const categories = [...new Set(foods.map(f => f.category))].filter(Boolean);
  const filteredFoods = foods.filter(f =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase()) &&
    (!foodCategory || f.category === foodCategory),
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-dim hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h2 className="text-white text-3xl font-bold tracking-tight">Meal Planner</h2>
            <p className="text-text-dim text-sm mt-1">Manage daily nutrition plans for users.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* User selector */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-[18px] pointer-events-none">person</span>
            <select
              value={targetUserId || ''}
              onChange={e => setTargetUserId(e.target.value || null)}
              className="pl-9 pr-4 py-2 bg-[#1a3324] border border-[#28392e] hover:border-primary/30 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 min-w-[200px] cursor-pointer transition-colors"
            >
              <option value="">Admin (self)</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.profile.full_name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={openFoodModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-background-dark text-sm font-bold transition-colors shadow-[0_0_15px_rgba(19,236,91,0.3)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Food
          </button>
        </div>
      </div>

      {/* ── Date navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-dark border border-[#28392e]">
        <button
          onClick={() => setSelectedDate(d => offsetDate(d, -1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#28392e] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-text-dim text-[20px]">chevron_left</span>
        </button>
        <button
          onClick={() => dateInputRef.current?.showPicker?.()}
          className="flex-1 text-center font-medium text-white hover:text-primary transition-colors capitalize cursor-pointer relative"
        >
          {formatDate(selectedDate)}
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="absolute inset-0 opacity-0 w-full cursor-pointer"
          />
        </button>
        <button
          onClick={() => setSelectedDate(d => offsetDate(d, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#28392e] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-text-dim text-[20px]">chevron_right</span>
        </button>
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="px-3 py-1.5 text-xs font-medium bg-[#28392e] hover:bg-[#344b3c] text-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-primary/30"
        >
          Today
        </button>
      </div>

      {/* ── Main 2-col layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: meal slot cards (2/3) */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl border border-[#28392e] bg-surface-dark p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28392e]" />
                  <div className="h-4 w-28 bg-[#28392e] rounded" />
                </div>
                <div className="h-3 w-full bg-[#28392e] rounded" />
              </div>
            ))
          ) : (
            MEAL_SLOTS.map(slot => {
              const slotItems = grouped[slot.key];
              const slotCals = slotItems.reduce((s, item) => s + item.calories, 0);
              return (
                <div key={slot.key} className="rounded-xl border border-[#28392e] bg-surface-dark overflow-hidden hover:border-primary/20 transition-colors">
                  {/* Slot header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#28392e]">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slot.color }} />
                      <span className="font-semibold text-white text-sm">{slot.label}</span>
                      <span className="text-xs text-text-dim">{slot.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {slotCals > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white bg-[#28392e]">
                          {slotCals} kcal
                        </span>
                      )}
                      <button
                        onClick={openFoodModal}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#28392e] hover:bg-[#344b3c] hover:border-primary/30 border border-transparent transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-text-dim text-[16px]">add</span>
                      </button>
                    </div>
                  </div>

                  {/* Slot items */}
                  {slotItems.length === 0 ? (
                    <div className="px-4 py-5 text-center text-xs text-text-dim">
                      No items — click + to add food
                    </div>
                  ) : (
                    <div className="divide-y divide-[#28392e]">
                      {slotItems.map(item => (
                        <div key={item._id} className="flex items-center gap-3 px-4 py-3 group hover:bg-[#28392e]/40 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white truncate">{item.name}</p>
                            {editingItem === item._id ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="number"
                                  value={editQuantity}
                                  onChange={e => setEditQuantity(parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-0.5 text-xs bg-background-dark border border-primary/50 rounded text-white focus:outline-none focus:border-primary"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') updateQuantity(item._id);
                                    if (e.key === 'Escape') setEditingItem(null);
                                  }}
                                />
                                <span className="text-xs text-text-dim">g</span>
                                <button onClick={() => updateQuantity(item._id)} className="text-xs text-primary hover:underline cursor-pointer font-medium">Save</button>
                                <button onClick={() => setEditingItem(null)} className="text-xs text-text-dim hover:underline cursor-pointer">Cancel</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingItem(item._id); setEditQuantity(item.quantity); }}
                                className="flex items-center gap-1 mt-0.5 text-xs text-text-dim hover:text-primary transition-colors cursor-pointer group/qty"
                              >
                                <span>{item.quantity}g</span>
                                <span className="material-symbols-outlined text-[12px] opacity-0 group-hover/qty:opacity-100 transition-opacity">edit</span>
                              </button>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-bold text-sm text-primary">{item.calories}</span>
                            <span className="text-xs text-text-dim ml-0.5">kcal</span>
                          </div>
                          <button
                            onClick={() => setDeleteTarget({ id: item._id, name: item.name })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right sidebar (1/3) */}
        <div className="flex flex-col gap-4">

          {/* User info */}
          <div className="p-5 rounded-xl bg-surface-dark border border-[#28392e]">
            <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Current User</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{targetName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">{targetName}</p>
                {selectedUser ? (
                  <p className="text-xs text-text-dim truncate">{selectedUser.email}</p>
                ) : (
                  <p className="text-xs text-text-dim">System Administrator</p>
                )}
              </div>
            </div>
          </div>

          {/* Calorie ring */}
          <div className="p-5 rounded-xl bg-surface-dark border border-[#28392e]">
            <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Calories Today</p>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                  <circle cx="56" cy="56" r="44" fill="none" stroke="#28392e" strokeWidth="10" />
                  <circle
                    cx="56" cy="56" r="44" fill="none" strokeWidth="10"
                    stroke={ringColor}
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - caloriePercent / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 6px ${ringColor}80)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{caloriePercent}%</span>
                  <span className="text-xs text-text-dim">of goal</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background-dark rounded-lg p-3 text-center border border-[#28392e]">
                <p className="text-xl font-bold text-white">{totalCalories.toLocaleString()}</p>
                <p className="text-xs text-text-dim mt-0.5">Consumed</p>
              </div>
              <div className="bg-background-dark rounded-lg p-3 text-center border border-[#28392e]">
                <p className="text-xl font-bold text-white">{calorieRemain.toLocaleString()}</p>
                <p className="text-xs text-text-dim mt-0.5">Remaining</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-[#28392e] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${caloriePercent}%` }} />
            </div>
            <p className="text-center text-xs text-text-dim mt-1.5">Goal: {CALORIE_GOAL.toLocaleString()} kcal</p>
          </div>

          {/* Macro estimate */}
          <div className="p-5 rounded-xl bg-surface-dark border border-[#28392e]">
            <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Macro Estimate</p>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Carbohydrate', value: estCarb,    goal: 250, color: 'bg-blue-500' },
                { label: 'Protein',      value: estProtein, goal: 60,  color: 'bg-primary'  },
                { label: 'Fat',          value: estFat,     goal: 65,  color: 'bg-yellow-400' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-dim">{m.label}</span>
                    <span className="text-xs font-bold text-white">{m.value}g</span>
                  </div>
                  <div className="h-1.5 bg-[#28392e] rounded-full">
                    <div className={`h-full ${m.color} rounded-full`} style={{ width: `${Math.min(100, (m.value / m.goal) * 100)}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-dim mt-4 pt-3 border-t border-[#28392e]">* Based on 50/25/25 carb/protein/fat split</p>
          </div>

          {/* Meal breakdown */}
          <div className="p-5 rounded-xl bg-surface-dark border border-[#28392e]">
            <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Meal Breakdown</p>
            <div className="flex flex-col gap-2.5">
              {MEAL_SLOTS.map(slot => {
                const cal = grouped[slot.key].reduce((s, i) => s + i.calories, 0);
                const pct = totalCalories > 0 ? Math.round((cal / totalCalories) * 100) : 0;
                return (
                  <div key={slot.key} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: slot.color }} />
                    <span className="text-xs text-text-dim w-16">{slot.label}</span>
                    <div className="flex-1 h-1.5 bg-[#28392e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: slot.color }} />
                    </div>
                    <span className="text-xs font-medium text-white w-16 text-right">{cal > 0 ? `${cal} kcal` : '—'}</span>
                  </div>
                );
              })}
            </div>
            {items.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#28392e] flex items-center justify-between">
                <span className="text-xs text-text-dim">Total</span>
                <span className="text-sm font-bold text-primary">{totalCalories.toLocaleString()} kcal</span>
              </div>
            )}
          </div>

          {/* 7-day mini chart */}
          <div className="p-5 rounded-xl bg-surface-dark border border-[#28392e]">
            <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Last 7 Days</p>
            <div className="flex items-end gap-1 h-16">
              {weekDates.map(date => {
                const cal = weeklyData[date] || 0;
                const h = weekMax > 0 ? Math.max(4, Math.round((cal / weekMax) * 56)) : 4;
                const isActive = date === selectedDate;
                const dayOfWeek = new Date(date + 'T00:00:00').getDay();
                return (
                  <div
                    key={date}
                    className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                    onClick={() => setSelectedDate(date)}
                  >
                    <div
                      className="w-full rounded-sm transition-all duration-300"
                      style={{
                        height: `${h}px`,
                        backgroundColor: isActive ? '#13ec5b' : '#28392e',
                        boxShadow: isActive ? '0 0 8px rgba(19,236,91,0.4)' : 'none',
                      }}
                      title={`${cal} kcal`}
                    />
                    <span className="text-[10px] font-medium" style={{ color: isActive ? '#13ec5b' : '#9db9a6' }}>
                      {DAY_ABBR[dayOfWeek]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-text-dim mt-2">Click bar to navigate to that day</p>
          </div>
        </div>
      </div>

      {/* ── Food picker modal ────────────────────────────────── */}
      {showFoodModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-darker rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-[#28392e]">

            <div className="flex items-center justify-between px-5 py-4 border-b border-[#28392e]">
              <div>
                <h3 className="font-bold text-white">Add Food</h3>
                <p className="text-xs text-text-dim mt-0.5">for {targetName}</p>
              </div>
              <button
                onClick={() => setShowFoodModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-white hover:bg-[#28392e] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="px-5 py-3 border-b border-[#28392e] flex flex-col gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-[18px] pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={foodSearch}
                  onChange={e => setFoodSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-background-dark border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              {categories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFoodCategory('')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${!foodCategory ? 'bg-primary text-background-dark' : 'bg-[#28392e] text-text-dim hover:text-white'}`}
                  >All</button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFoodCategory(cat === foodCategory ? '' : cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${cat === foodCategory ? 'bg-primary text-background-dark' : 'bg-[#28392e] text-text-dim hover:text-white'}`}
                    >{cat}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredFoods.length === 0 ? (
                <div className="text-center py-10 text-text-dim text-sm">No foods found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-darker border-b border-[#28392e]">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-dim uppercase tracking-wide">Name</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-text-dim uppercase tracking-wide">Type</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-text-dim uppercase tracking-wide">kcal/100g</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-text-dim uppercase tracking-wide">Gram</th>
                      <th className="px-3 py-2.5 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#28392e]">
                    {filteredFoods.map(food => (
                      <tr key={food._id} className="hover:bg-[#28392e]/60 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-white">{food.name}</td>
                        <td className="px-3 py-2.5">
                          {food.category
                            ? <span className="px-2 py-0.5 rounded-full text-xs bg-[#28392e] text-text-dim">{food.category}</span>
                            : <span className="text-text-dim">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-primary">{food.calories}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={quantities[food._id] ?? 100}
                            onChange={e => setQuantities(q => ({ ...q, [food._id]: parseInt(e.target.value) || 0 }))}
                            min="1" max="5000"
                            className="w-16 px-2 py-1 text-xs text-center bg-background-dark border border-[#28392e] rounded text-white focus:outline-none focus:border-primary/50 block mx-auto"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => addFood(food._id)}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-background-dark text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >Add</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ─────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-darker rounded-2xl w-full max-w-sm p-6 border border-[#28392e] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400 text-[20px]">delete</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Remove Food</h3>
                <p className="text-xs text-text-dim">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-dim mb-6">
              Remove <span className="text-white font-medium">"{deleteTarget.name}"</span> from the meal plan?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-[#28392e] hover:bg-[#344b3c] text-white text-sm font-medium transition-colors cursor-pointer"
              >Cancel</button>
              <button
                onClick={deleteItem}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors cursor-pointer"
              >Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlannerSection;
