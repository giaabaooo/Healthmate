import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/confirm-modal';

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

// Meal slot types
const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Bữa sáng', icon: '☀️', time: '6:00 - 9:00', color: 'amber' },
  { key: 'lunch',     label: 'Bữa trưa', icon: '🌤️', time: '11:00 - 13:00', color: 'green' },
  { key: 'dinner',    label: 'Bữa tối',  icon: '🌙', time: '17:00 - 20:00', color: 'indigo' },
  { key: 'snack',     label: 'Bữa phụ',  icon: '🍎', time: 'Khác',           color: 'rose' },
] as const;
type MealSlot = typeof MEAL_SLOTS[number]['key'];

const SLOT_STYLES: Record<string, { badge: string; dot: string; addBtn: string }> = {
  breakfast: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dot: 'bg-amber-400',
    addBtn: 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20',
  },
  lunch: {
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dot: 'bg-green-400',
    addBtn: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
  },
  dinner: {
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    dot: 'bg-indigo-400',
    addBtn: 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
  },
  snack: {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    dot: 'bg-rose-400',
    addBtn: 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20',
  },
};

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Navigate dates
function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const AdminMealPlannerPage = () => {
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<MealItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);

  // Food modal state
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

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/users', { headers: getAuthHeaders() });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải users:', err);
    }
  };

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      const q = targetUserId ? `?target_user_id=${targetUserId}` : '';
      const res = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}${q}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setItems(data.items || []);
      setTotalCalories(data.total_calories || 0);
    } catch (err) {
      console.error('Lỗi tải meal plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/foods');
      const data = await res.json();
      setFoods(data);
      // init quantities
      const init: Record<string, number> = {};
      data.forEach((f: Food) => { init[f._id] = 100; });
      setQuantities(init);
    } catch (err) {
      console.error('Lỗi tải foods:', err);
    }
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
      const res = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}/items`, {
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
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  const updateQuantity = async (itemId: string) => {
    if (editQuantity <= 0 || editQuantity > 5000) {
      toast.error('Số gram phải từ 1–5000');
      return;
    }
    try {
      const body: Record<string, unknown> = { quantity: editQuantity };
      if (targetUserId) body.target_user_id = targetUserId;
      const res = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}/items/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Đã cập nhật');
        fetchMealPlan();
        setEditingItem(null);
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  const handleRemoveConfirm = async () => {
    try {
      const q = targetUserId ? `?target_user_id=${targetUserId}` : '';
      const res = await fetch(
        `http://localhost:8000/api/meal-plans/${selectedDate}/items/${deleteModal.itemId}${q}`,
        { method: 'DELETE', headers: getAuthHeaders() },
      );
      if (res.ok) {
        toast.success('Đã xóa món ăn');
        fetchMealPlan();
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setDeleteModal({ isOpen: false, itemId: '', itemName: '' });
    }
  };

  const selectedUser = targetUserId ? users.find(u => u._id === targetUserId) : null;
  const targetName = selectedUser ? selectedUser.profile.full_name : 'Admin';

  // Derived food list with search + category filter
  const categories = [...new Set(foods.map(f => f.category))].filter(Boolean);
  const filteredFoods = foods.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(foodSearch.toLowerCase());
    const matchCat = !foodCategory || f.category === foodCategory;
    return matchSearch && matchCat;
  });

  // Calorie goal mock (2000 kcal) — could be wired to user goal later
  const calorieGoal = 2000;
  const caloriePercent = Math.min(100, Math.round((totalCalories / calorieGoal) * 100));
  const calorieColor = caloriePercent >= 100 ? 'bg-red-500' : caloriePercent >= 75 ? 'bg-amber-400' : 'bg-primary';

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý thực đơn</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Lập kế hoạch dinh dưỡng theo ngày cho từng người dùng
            </p>
          </div>

          {/* User selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 whitespace-nowrap">Người dùng:</span>
            <select
              value={targetUserId || ''}
              onChange={e => setTargetUserId(e.target.value || null)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-w-[180px] cursor-pointer"
            >
              <option value="">Admin (bản thân)</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.profile.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Date nav ───────────────────────────────────── */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
          <button
            onClick={() => setSelectedDate(d => offsetDate(d, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        {/* ── Calorie summary card ───────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tổng calo hôm nay</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {totalCalories.toLocaleString()}
                  <span className="text-base font-medium text-slate-400 ml-1">kcal</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Mục tiêu</p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{calorieGoal.toLocaleString()} kcal</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${calorieColor}`}
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{caloriePercent}% mục tiêu hàng ngày</p>
          </div>

          {/* Stat: meals count */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Số món</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{items.length}</p>
            <p className="text-xs text-slate-400">món ăn trong ngày</p>
          </div>

          {/* Stat: avg cal per item */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">TB / món</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {items.length ? Math.round(totalCalories / items.length) : 0}
            </p>
            <p className="text-xs text-slate-400">kcal trung bình</p>
          </div>
        </div>

        {/* ── Meal table ────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">

          {/* Table toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-white">
              Danh sách món ăn
              {items.length > 0 && (
                <span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              )}
            </h2>
            <button
              onClick={openFoodModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-slate-900 text-xs font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Thêm món
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-6">
                    #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Tên món
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Bữa
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Khối lượng
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Calories
                  </th>
                  <th className="px-4 py-2.5 w-16" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  /* Skeleton rows */
                  [1, 2, 3, 4].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-3"><div className="h-3 w-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto" /></td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                      Chưa có món ăn nào trong ngày này
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const slot = MEAL_SLOTS[idx % MEAL_SLOTS.length];
                    const st = SLOT_STYLES[slot.key];
                    return (
                      <tr key={item._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* # */}
                        <td className="px-5 py-3 text-xs text-slate-400 font-medium">{idx + 1}</td>

                        {/* Name */}
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                          {item.name}
                        </td>

                        {/* Meal slot badge */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {slot.label}
                          </span>
                        </td>

                        {/* Quantity - inline editable */}
                        <td className="px-4 py-3 text-right">
                          {editingItem === item._id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                value={editQuantity}
                                onChange={e => setEditQuantity(parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-xs text-right bg-white dark:bg-slate-900 border border-primary rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
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
                              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-primary transition cursor-pointer group/qty"
                            >
                              <span className="font-medium">{item.quantity}g</span>
                              <svg className="w-3 h-3 text-slate-300 group-hover/qty:text-primary transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A4 4 0 019 17H7v-2a4 4 0 012.172-3.586z" />
                              </svg>
                            </button>
                          )}
                        </td>

                        {/* Calories */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-primary">{item.calories}</span>
                          <span className="text-xs text-slate-400 ml-1">kcal</span>
                        </td>

                        {/* Delete action */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, itemId: item._id, itemName: item.name })}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Footer total row */}
              {!loading && items.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Tổng cộng
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-primary text-base">{totalCalories.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 ml-1">kcal</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* ── Food picker modal ─────────────────────────── */}
      {showFoodModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

            {/* Modal header */}
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

            {/* Search + filter */}
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
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                      !foodCategory
                        ? 'bg-primary text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFoodCategory(cat === foodCategory ? '' : cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                        cat === foodCategory
                          ? 'bg-primary text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Food table */}
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
                      <tr key={food._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-white">{food.name}</td>
                        <td className="px-3 py-2.5">
                          {food.category ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {food.category}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-primary">{food.calories}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={quantities[food._id] ?? 100}
                            onChange={e => setQuantities(q => ({ ...q, [food._id]: parseInt(e.target.value) || 0 }))}
                            min="1"
                            max="5000"
                            className="w-16 px-2 py-1 text-xs text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary block mx-auto"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => addFoodToMealPlan(food._id)}
                            className="px-3 py-1.5 bg-primary text-slate-900 text-xs font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer"
                          >
                            Thêm
                          </button>
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
