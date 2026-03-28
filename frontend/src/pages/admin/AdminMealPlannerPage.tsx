import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import ConfirmModal from '../../components/confirm-modal';

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

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Bữa sáng', time: '06:00–09:00', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', dot: 'bg-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  { key: 'lunch',     label: 'Bữa trưa', time: '11:00–13:00', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',   dot: 'bg-blue-400',  badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { key: 'dinner',    label: 'Bữa tối',  time: '17:00–20:00', color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800', dot: 'bg-violet-400', badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  { key: 'snack',     label: 'Bữa phụ',  time: 'Khác',        color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',  dot: 'bg-green-400', badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
] as const;
type MealSlot = typeof MEAL_SLOTS[number]['key'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function buildWeekDates(anchor: string): string[] {
  return Array.from({ length: 7 }, (_, i) => offsetDate(anchor, i - 6));
}

// Split items round-robin into meal slots (same logic as customer)
function groupBySlot(items: MealItem[]): Record<MealSlot, MealItem[]> {
  const g: Record<MealSlot, MealItem[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  items.forEach((item, i) => { g[MEAL_SLOTS[i % 4].key].push(item); });
  return g;
}

const CALORIE_GOAL = 2000;
const DAY_ABBR = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const AdminMealPlannerPage = () => {
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<MealItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);

  // Weekly calorie data for mini chart
  const [weeklyData, setWeeklyData] = useState<Record<string, number>>({});

  // Food modal
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Inline edit
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemId: string; itemName: string }>({
    isOpen: false, itemId: '', itemName: '',
  });

  const dateInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchMealPlan(); }, [selectedDate, targetUserId]);
  useEffect(() => { fetchWeeklyData(); }, [selectedDate, targetUserId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('https://healthmate-y9vt.onrender.com/api/users', { headers: getAuthHeaders() });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Lỗi tải users:', err); }
  };

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      const q = targetUserId ? `?target_user_id=${targetUserId}` : '';
      const res = await fetch(`https://healthmate-y9vt.onrender.com/api/meal-plans/${selectedDate}${q}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setItems(data.items || []);
      setTotalCalories(data.total_calories || 0);
    } catch (err) { console.error('Lỗi tải meal plan:', err); }
    finally { setLoading(false); }
  };

  const fetchWeeklyData = async () => {
    const week = buildWeekDates(selectedDate);
    const results: Record<string, number> = {};
    await Promise.all(week.map(async (date) => {
      try {
        const q = targetUserId ? `?target_user_id=${targetUserId}` : '';
        const res = await fetch(`https://healthmate-y9vt.onrender.com/api/meal-plans/${date}${q}`, { headers: getAuthHeaders() });
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
    } catch (err) { console.error('Lỗi tải foods:', err); }
  };

  const openFoodModal = () => {
    fetchFoods();
    setFoodSearch('');
    setFoodCategory('');
    setShowFoodModal(true);
  };

  const addFoodToMealPlan = async (foodId: string) => {
    const quantity = quantities[foodId] || 100;
    try {
      const body: Record<string, unknown> = { food_id: foodId, quantity };
      if (targetUserId) body.target_user_id = targetUserId;
      const res = await fetch(`https://healthmate-y9vt.onrender.com/api/meal-plans/${selectedDate}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Đã thêm món ăn');
        fetchMealPlan();
        setShowFoodModal(false);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Lỗi khi thêm món ăn');
      }
    } catch { toast.error('Lỗi kết nối'); }
  };

  const updateQuantity = async (itemId: string) => {
    if (editQuantity <= 0 || editQuantity > 5000) { toast.error('Số gram phải từ 1–5000'); return; }
    try {
      const body: Record<string, unknown> = { quantity: editQuantity };
      if (targetUserId) body.target_user_id = targetUserId;
      const res = await fetch(`https://healthmate-y9vt.onrender.com/api/meal-plans/${selectedDate}/items/${itemId}`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) { toast.success('Đã cập nhật'); fetchMealPlan(); setEditingItem(null); }
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleRemoveConfirm = async () => {
    try {
      const q = targetUserId ? `?target_user_id=${targetUserId}` : '';
      const res = await fetch(
        `https://healthmate-y9vt.onrender.com/api/meal-plans/${selectedDate}/items/${deleteModal.itemId}${q}`,
        { method: 'DELETE', headers: getAuthHeaders() },
      );
      if (res.ok) { toast.success('Đã xóa món ăn'); fetchMealPlan(); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setDeleteModal({ isOpen: false, itemId: '', itemName: '' }); }
  };

  // Derived
  const selectedUser = targetUserId ? users.find(u => u._id === targetUserId) : null;
  const targetName = selectedUser ? selectedUser.profile.full_name : 'Admin';
  const targetEmail = selectedUser?.email ?? '';
  const caloriePercent = Math.min(100, Math.round((totalCalories / CALORIE_GOAL) * 100));
  const calorieRemain = Math.max(0, CALORIE_GOAL - totalCalories);
  const calorieBarColor = caloriePercent >= 100 ? 'bg-red-500' : caloriePercent >= 75 ? 'bg-amber-400' : 'bg-primary';

  const grouped = groupBySlot(items);

  // Macro estimate (50% carb, 25% protein, 25% fat)
  const estCarb    = Math.round((totalCalories * 0.50) / 4);
  const estProtein = Math.round((totalCalories * 0.25) / 4);
  const estFat     = Math.round((totalCalories * 0.25) / 9);

  // Weekly bar chart
  const weekDates = buildWeekDates(selectedDate);
  const weekMax = Math.max(...weekDates.map(d => weeklyData[d] || 0), CALORIE_GOAL);

  const categories = [...new Set(foods.map(f => f.category))].filter(Boolean);
  const filteredFoods = foods.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(foodSearch.toLowerCase());
    const matchCat = !foodCategory || f.category === foodCategory;
    return matchSearch && matchCat;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý thực đơn</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Lập kế hoạch dinh dưỡng theo ngày cho từng người dùng
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* User selector */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <select
                value={targetUserId || ''}
                onChange={e => setTargetUserId(e.target.value || null)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-w-[200px] cursor-pointer"
              >
                <option value="">Admin (bản thân)</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.profile.full_name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={openFoodModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-slate-900 text-sm font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Thêm món
            </button>
          </div>
        </div>

        {/* ── Date nav ───────────────────────────────────── */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
          <button
            onClick={() => setSelectedDate(d => offsetDate(d, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="flex-1 text-center font-medium text-slate-900 dark:text-white hover:text-primary transition capitalize cursor-pointer relative"
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
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Hôm nay
          </button>
        </div>

        {/* ── Main 2-col layout ──────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left: Meal slot cards (2/3) ── */}
          <div className="xl:col-span-2 space-y-4">
            {loading ? (
              // Skeleton loading
              [1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
                  <div className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                  <div className="px-4 py-4 bg-white/50 dark:bg-slate-900/50">
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              ))
            ) : (
              MEAL_SLOTS.map(slot => {
                const slotItems = grouped[slot.key];
                const slotCals = slotItems.reduce((s, item) => s + item.calories, 0);
                return (
                  <div key={slot.key} className={`rounded-xl border overflow-hidden ${slot.color}`}>
                    {/* Slot header */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${slot.dot}`} />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-white text-sm">{slot.label}</span>
                          <span className="ml-2 text-xs text-slate-400">{slot.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {slotCals > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${slot.badge}`}>
                            {slotCals} kcal
                          </span>
                        )}
                        <button
                          onClick={openFoodModal}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Slot items */}
                    {slotItems.length === 0 ? (
                      <div className="px-4 py-4 text-center text-xs text-slate-400 bg-white/30 dark:bg-slate-900/30">
                        Chưa có món — nhấn + để thêm
                      </div>
                    ) : (
                      <div className="bg-white/50 dark:bg-slate-900/50 divide-y divide-white/60 dark:divide-slate-700/50">
                        {slotItems.map(item => (
                          <div key={item._id} className="flex items-center gap-3 px-4 py-2.5 group">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 dark:text-white truncate">{item.name}</p>
                              {editingItem === item._id ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input
                                    type="number"
                                    value={editQuantity}
                                    onChange={e => setEditQuantity(parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-0.5 text-xs bg-white dark:bg-slate-800 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                    autoFocus
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') updateQuantity(item._id);
                                      if (e.key === 'Escape') setEditingItem(null);
                                    }}
                                  />
                                  <span className="text-xs text-slate-400">g</span>
                                  <button onClick={() => updateQuantity(item._id)} className="text-xs text-primary font-medium hover:underline cursor-pointer">Lưu</button>
                                  <button onClick={() => setEditingItem(null)} className="text-xs text-slate-400 hover:underline cursor-pointer">Hủy</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingItem(item._id); setEditQuantity(item.quantity); }}
                                  className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 hover:text-primary transition cursor-pointer group/qty"
                                >
                                  <span>{item.quantity}g</span>
                                  <svg className="w-2.5 h-2.5 opacity-0 group-hover/qty:opacity-100 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A4 4 0 019 17H7v-2a4 4 0 012.172-3.586z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-semibold text-sm text-primary">{item.calories}</span>
                              <span className="text-xs text-slate-400 ml-0.5">kcal</span>
                            </div>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, itemId: item._id, itemName: item.name })}
                              className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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

          {/* ── Right sidebar (1/3) ── */}
          <div className="space-y-4">

            {/* User info card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Người dùng hiện tại</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{targetName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{targetName}</p>
                  {targetEmail && <p className="text-xs text-slate-400 truncate">{targetEmail}</p>}
                  {!targetUserId && <p className="text-xs text-slate-400">Quản trị viên</p>}
                </div>
              </div>
            </div>

            {/* Calorie ring */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Lượng calo hôm nay</p>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                    <circle
                      cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 44}`}
                      strokeDashoffset={`${2 * Math.PI * 44 * (1 - caloriePercent / 100)}`}
                      strokeLinecap="round"
                      className={caloriePercent >= 100 ? 'text-red-500' : caloriePercent >= 75 ? 'text-amber-400' : 'text-primary'}
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{caloriePercent}%</span>
                    <span className="text-xs text-slate-400">mục tiêu</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{totalCalories.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Đã nạp</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{calorieRemain.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Còn lại</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${calorieBarColor}`}
                  style={{ width: `${caloriePercent}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-400 mt-1.5">Mục tiêu: {CALORIE_GOAL.toLocaleString()} kcal</p>
            </div>

            {/* Macro estimate */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Ước tính dưỡng chất</p>
              <div className="space-y-3">
                {[
                  { label: 'Carbohydrate', value: estCarb,    goal: 250, color: 'bg-blue-400',   note: '~250g/ngày' },
                  { label: 'Protein',      value: estProtein, goal: 60,  color: 'bg-primary',     note: '~60g/ngày'  },
                  { label: 'Chất béo',     value: estFat,     goal: 65,  color: 'bg-amber-400',   note: '~65g/ngày'  },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{m.label}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.value}g</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <div className={`h-full ${m.color} rounded-full`} style={{ width: `${Math.min(100, (m.value / m.goal) * 100)}%`, transition: 'width 0.5s ease' }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Mục tiêu {m.note}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                * Ước tính dựa trên phân bổ 50/25/25 (carb/protein/fat)
              </p>
            </div>

            {/* Daily summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tổng kết ngày</p>
              <div className="space-y-2">
                {MEAL_SLOTS.map(slot => {
                  const cal = grouped[slot.key].reduce((s, i) => s + i.calories, 0);
                  const pct = totalCalories > 0 ? Math.round((cal / totalCalories) * 100) : 0;
                  return (
                    <div key={slot.key} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${slot.dot}`} />
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-20">{slot.label}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${slot.dot}`} style={{ width: `${pct}%`, transition: 'width 0.5s ease' }} />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-14 text-right">
                        {cal > 0 ? `${cal} kcal` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Tổng cộng</span>
                  <span className="text-sm font-bold text-primary">{totalCalories.toLocaleString()} kcal</span>
                </div>
              )}
            </div>

            {/* 7-day mini bar chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">7 ngày gần đây</p>
              <div className="flex items-end gap-1 h-16">
                {weekDates.map(date => {
                  const cal = weeklyData[date] || 0;
                  const h = weekMax > 0 ? Math.max(4, Math.round((cal / weekMax) * 56)) : 4;
                  const isToday = date === selectedDate;
                  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setSelectedDate(date)}>
                      <div
                        className={`w-full rounded-sm transition-all duration-300 ${isToday ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-primary/60'}`}
                        style={{ height: `${h}px` }}
                        title={`${cal} kcal`}
                      />
                      <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                        {DAY_ABBR[dayOfWeek]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-primary" />
                <span className="text-[10px] text-slate-400">Ngày đang xem — Click cột để chuyển ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Food picker modal ─────────────────────────── */}
      {showFoodModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Chọn món ăn</h3>
                <p className="text-xs text-slate-400 mt-0.5">cho {targetName}</p>
              </div>
              <button
                onClick={() => setShowFoodModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm món ăn..."
                  value={foodSearch}
                  onChange={e => setFoodSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  autoFocus
                />
              </div>
              {categories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFoodCategory('')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${!foodCategory ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >Tất cả</button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFoodCategory(cat === foodCategory ? '' : cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${cat === foodCategory ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >{cat}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredFoods.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">Không tìm thấy món ăn nào</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tên món</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Loại</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Calo/100g</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gram</th>
                      <th className="px-3 py-2.5 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFoods.map(food => (
                      <tr key={food._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-white">{food.name}</td>
                        <td className="px-3 py-2.5">
                          {food.category
                            ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{food.category}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-primary">{food.calories}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={quantities[food._id] ?? 100}
                            onChange={e => setQuantities(q => ({ ...q, [food._id]: parseInt(e.target.value) || 0 }))}
                            min="1" max="5000"
                            className="w-16 px-2 py-1 text-xs text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary block mx-auto"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => addFoodToMealPlan(food._id)}
                            className="px-3 py-1.5 bg-primary text-slate-900 text-xs font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer"
                          >Thêm</button>
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

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Xóa món ăn"
        message={`Xóa "${deleteModal.itemName}" khỏi thực đơn?`}
        confirmText="Xóa"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, itemId: '', itemName: '' })}
      />
    </AdminLayout>
  );
};

export default AdminMealPlannerPage;
