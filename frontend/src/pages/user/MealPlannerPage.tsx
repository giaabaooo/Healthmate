import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/confirm-modal';

interface MealItem {
  _id: string;
  food_id: string;
  name: string;
  quantity: number;
  calories: number;
  slot: MealSlot; 
}

interface Food {
  _id: string;
  name: string;
  category: string;
  calories: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Bữa sáng', time: '06:00–09:00', icon: '🌅', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', dot: 'bg-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  { key: 'lunch',     label: 'Bữa trưa', time: '11:00–13:00', icon: '☀️', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',   dot: 'bg-blue-400',  badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { key: 'dinner',    label: 'Bữa tối',  time: '17:00–20:00', icon: '🌙', color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800', dot: 'bg-violet-400', badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  { key: 'snack',     label: 'Bữa phụ',  time: 'Khác',        icon: '🍎', color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',  dot: 'bg-green-400', badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
] as const;
type MealSlot = typeof MEAL_SLOTS[number]['key'];

// Phân nhóm chính xác theo trường 'slot' từ DB
function groupBySlot(items: MealItem[]): Record<MealSlot, MealItem[]> {
  const g: Record<MealSlot, MealItem[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  items.forEach((item) => { 
    if(g[item.slot]) g[item.slot].push(item);
    else g['snack'].push(item); // Đẩy vào snack nếu bản ghi cũ thiếu slot
  });
  return g;
}

const MealPlannerPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<MealItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);

  // States cho Goal & AI
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalReason, setGoalReason] = useState("");
  const [aiRecs, setAiRecs] = useState<any>({});
  const [loadingAI, setLoadingAI] = useState(false);

  // Modal thêm Food
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [targetSlot, setTargetSlot] = useState<MealSlot>('breakfast');
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: '', itemName: '' });

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    fetchMealPlan(); 
    fetchAiRecs(); 
  }, [selectedDate]);

  const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setItems(data.items || []);
      setTotalCalories(data.total_calories || 0);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchFoods = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/foods');
      const data = await res.json();
      setFoods(data);
      const init: Record<string, number> = {};
      data.forEach((f: Food) => { init[f._id] = 100; });
      setQuantities(init);
    } catch (err) { console.error(err); }
  };

  // Tính Goal qua AI
  const calculateGoalByAI = async () => {
    try {
      toast.loading("AI đang phân tích cơ thể bạn...", {id: 'ai-goal'});
      const res = await fetch('http://localhost:8000/api/meal-plans/ai/goal', { headers: getAuthHeaders() });
      const data = await res.json();
      if(data.suggestedCalories) {
        setCalorieGoal(data.suggestedCalories);
        setGoalReason(data.reason);
        toast.success("Đã cập nhật mục tiêu!", {id: 'ai-goal'});
      } else throw new Error();
    } catch (err) { toast.error("Lỗi gọi AI", {id: 'ai-goal'}); }
  };

  // Lấy gợi ý món ăn từ AI
  const fetchAiRecs = async () => {
    try {
      setLoadingAI(true);
      const res = await fetch('http://localhost:8000/api/meal-plans/ai/recommend', { headers: getAuthHeaders() });
      const data = await res.json();
      setAiRecs(data || {});
    } catch (err) { console.error(err); } finally { setLoadingAI(false); }
  };

  const openFoodModal = (slot: MealSlot) => {
    setTargetSlot(slot);
    fetchFoods();
    setShowFoodModal(true);
  };

  const addFoodToMealPlan = async (foodId: string, quantity: number, forceSlot?: MealSlot) => {
    try {
      const res = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ food_id: foodId, quantity, slot: forceSlot || targetSlot }), 
      });
      if (res.ok) {
        toast.success('Đã thêm món ăn');
        fetchMealPlan();
        setShowFoodModal(false);
      } else {
        toast.error('Lỗi khi thêm món ăn');
      }
    } catch { toast.error('Lỗi kết nối'); }
  };

  const updateQuantity = async (itemId: string) => {
    if (editQuantity <= 0 || editQuantity > 5000) { toast.error('Số gram phải từ 1–5000'); return; }
    try {
      const res = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}/items/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity: editQuantity }),
      });
      if (res.ok) { toast.success('Đã cập nhật'); fetchMealPlan(); setEditingItem(null); }
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleRemoveConfirm = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/meal-plans/${selectedDate}/items/${deleteModal.itemId}`,
        { method: 'DELETE', headers: getAuthHeaders() },
      );
      if (res.ok) { toast.success('Đã xóa món ăn'); fetchMealPlan(); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setDeleteModal({ isOpen: false, itemId: '', itemName: '' }); }
  };

  const caloriePercent = Math.min(100, Math.round((totalCalories / calorieGoal) * 100));
  const calorieRemain = Math.max(0, calorieGoal - totalCalories);
  const calorieBarColor = caloriePercent >= 100 ? 'bg-red-500' : caloriePercent >= 75 ? 'bg-amber-400' : 'bg-primary';
  const grouped = groupBySlot(items);
  const categories = [...new Set(foods.map(f => f.category))].filter(Boolean);
  const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase()) && (!foodCategory || f.category === foodCategory));

  const estCarb    = Math.round((calorieGoal * 0.50) / 4);
  const estProtein = Math.round((calorieGoal * 0.25) / 4);
  const estFat     = Math.round((calorieGoal * 0.25) / 9);

  return (
    <Layout>
      <div className="space-y-5">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thực đơn của tôi</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi dinh dưỡng hàng ngày</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {toast.loading("Đang làm mới AI...", {id:'refresh'}); fetchAiRecs().then(() => toast.success("Đã làm mới", {id:'refresh'}));}} 
              disabled={loadingAI}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/20 text-primary text-sm font-bold rounded-lg hover:bg-primary/30 transition">
               <span className={`material-symbols-outlined text-lg ${loadingAI ? 'animate-spin' : ''}`}>sync</span> 
               {loadingAI ? 'Đang tải...' : 'Làm mới gợi ý AI'}
            </button>
            <Link to="/foods" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-[18px]">restaurant_menu</span> Thư viện
            </Link>
          </div>
        </div>

        {/* --- Date nav --- */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
          <button onClick={() => setSelectedDate(d => offsetDate(d, -1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
            <span className="material-symbols-outlined text-slate-500">chevron_left</span>
          </button>
          <button onClick={() => dateInputRef.current?.showPicker?.()} className="flex-1 text-center font-medium text-slate-900 dark:text-white hover:text-primary transition capitalize cursor-pointer relative">
            {formatDate(selectedDate)}
            <input ref={dateInputRef} type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 w-full cursor-pointer" />
          </button>
          <button onClick={() => setSelectedDate(d => offsetDate(d, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
            <span className="material-symbols-outlined text-slate-500">chevron_right</span>
          </button>
          <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
            Hôm nay
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* CỘT TRÁI: BỮA ĂN VÀ GỢI Ý AI */}
          <div className="lg:col-span-2 space-y-4">
            {MEAL_SLOTS.map(slot => {
              const slotItems = grouped[slot.key];
              const slotCals = slotItems.reduce((s, i) => s + i.calories, 0);
              const recs = aiRecs[slot.key] || [];

              return (
                <div key={slot.key} className={`rounded-xl border overflow-hidden ${slot.color}`}>
                  {/* Header Bữa ăn */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white/40 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${slot.dot}`} />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-white text-sm">{slot.label}</span>
                        <span className="ml-2 text-xs text-slate-400">{slot.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {slotCals > 0 && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${slot.badge}`}>{slotCals} kcal</span>}
                      <button onClick={() => openFoodModal(slot.key)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:scale-105 transition cursor-pointer text-slate-600 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  </div>

                  {/* List món đã thêm */}
                  {slotItems.length === 0 ? (
                    <div className="px-4 py-4 text-center text-xs text-slate-400 bg-white/30 dark:bg-slate-900/30">
                      Chưa có món — nhấn dấu cộng để thêm
                    </div>
                  ) : (
                    <div className="bg-white/50 dark:bg-slate-900/50 divide-y divide-white/60 dark:divide-slate-700/50">
                      {slotItems.map(item => (
                        <div key={item._id} className="flex items-center gap-3 px-4 py-2.5 group">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-800 dark:text-white truncate">{item.name}</p>
                            {editingItem === item._id ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input type="number" value={editQuantity} onChange={e => setEditQuantity(parseInt(e.target.value) || 0)} className="w-16 px-2 py-0.5 text-xs bg-white dark:bg-slate-800 border border-primary rounded focus:outline-none" autoFocus onKeyDown={e => { if (e.key === 'Enter') updateQuantity(item._id); if (e.key === 'Escape') setEditingItem(null); }} />
                                <span className="text-xs text-slate-400">g</span>
                                <button onClick={() => updateQuantity(item._id)} className="text-xs text-primary font-medium hover:underline">Lưu</button>
                                <button onClick={() => setEditingItem(null)} className="text-xs text-slate-400 hover:underline">Hủy</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingItem(item._id); setEditQuantity(item.quantity); }} className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 hover:text-primary transition group/qty">
                                <span>{item.quantity}g</span>
                                <span className="material-symbols-outlined text-[12px] opacity-0 group-hover/qty:opacity-100 transition">edit</span>
                              </button>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-semibold text-sm text-primary">{item.calories}</span>
                            <span className="text-xs text-slate-400 ml-0.5">kcal</span>
                          </div>
                          <button onClick={() => setDeleteModal({ isOpen: true, itemId: item._id, itemName: item.name })} className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI RECOMMENDATIONS THEO BỮA */}
                  {recs.length > 0 && (
                    <div className="p-3 bg-white/30 dark:bg-slate-900/30 border-t border-white/50 dark:border-slate-800">
                      <p className="text-xs font-black text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span> Gợi ý từ AI
                      </p>
                      {recs.map((rcm: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mb-2">
                           <div className="pr-4">
                             <p className="text-sm font-bold dark:text-white">{rcm.name}</p>
                             <p className="text-[11px] text-slate-500 mt-0.5">{rcm.quantity}g • <span className="text-amber-500 font-medium">{rcm.calories} kcal</span></p>
                             <p className="text-[10px] text-primary italic mt-1">{rcm.reason}</p>
                           </div>
                           <button onClick={() => addFoodToMealPlan(rcm._id, rcm.quantity, slot.key)} className="bg-primary/20 text-primary hover:bg-primary hover:text-slate-900 px-3 py-1.5 rounded text-xs font-bold transition flex-shrink-0">
                             Thêm
                           </button>
                         </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* CỘT PHẢI: STATS & GOALS */}
          <div className="space-y-4">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mục tiêu Calo</p>
                 <button onClick={calculateGoalByAI} className="text-[10px] font-bold bg-primary text-black px-2 py-1 rounded flex items-center gap-1 hover:brightness-110 active:scale-95 transition">
                   <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI Tính Toán
                 </button>
              </div>

              {goalReason && <p className="text-xs text-primary bg-primary/10 p-2 rounded-lg mb-4 italic leading-relaxed">{goalReason}</p>}

              <div className="flex items-center justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                    <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - caloriePercent / 100)}`} strokeLinecap="round" className={calorieBarColor} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{caloriePercent}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{totalCalories}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Đã nạp</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{calorieRemain}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Còn lại</p>
                </div>
              </div>

              {/* Chỉnh sửa Calo Target */}
              <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                {isEditingGoal ? (
                  <div className="flex items-center justify-center gap-2">
                    <input type="number" value={calorieGoal} onChange={e => setCalorieGoal(Number(e.target.value))} className="w-20 px-2 py-1 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-primary rounded outline-none" autoFocus />
                    <button onClick={() => setIsEditingGoal(false)} className="text-xs text-primary font-bold">Lưu</button>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:text-primary transition flex justify-center items-center gap-1" onClick={() => setIsEditingGoal(true)}>
                    Mục tiêu: {calorieGoal.toLocaleString()} kcal <span className="material-symbols-outlined text-[14px]">edit</span>
                  </p>
                )}
              </div>
            </div>

            {/* Macro estimate (Dựa trên Goal) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Phân bổ Dưỡng chất</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1"><span className="text-xs text-slate-600 dark:text-slate-400">Carbohydrate (50%)</span><span className="text-xs font-bold dark:text-slate-300">{estCarb}g</span></div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-blue-400 rounded-full" style={{ width: '50%' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="text-xs text-slate-600 dark:text-slate-400">Protein (25%)</span><span className="text-xs font-bold dark:text-slate-300">{estProtein}g</span></div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: '25%' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="text-xs text-slate-600 dark:text-slate-400">Chất béo (25%)</span><span className="text-xs font-bold dark:text-slate-300">{estFat}g</span></div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-amber-400 rounded-full" style={{ width: '25%' }} /></div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Modal Chọn Món Thủ Công */}
      {showFoodModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Thêm vào: {MEAL_SLOTS.find(s=>s.key===targetSlot)?.label}</h3>
              <button onClick={() => setShowFoodModal(false)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <input type="text" placeholder="Tìm món ăn..." value={foodSearch} onChange={e => setFoodSearch(e.target.value)} className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
              {categories.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  <button onClick={() => setFoodCategory('')} className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${!foodCategory ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>Tất cả</button>
                  {categories.map(cat => <button key={cat} onClick={() => setFoodCategory(cat === foodCategory ? '' : cat)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${cat === foodCategory ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{cat}</button>)}
                </div>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {filteredFoods.map(food => (
                <div key={food._id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition">
                  <div>
                    <p className="font-bold text-sm dark:text-white">{food.name}</p>
                    <p className="text-xs text-slate-500">{food.calories} kcal/100g {food.category && `• ${food.category}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" value={quantities[food._id] ?? 100} onChange={e => setQuantities(q => ({ ...q, [food._id]: parseInt(e.target.value) || 0 }))} className="w-14 px-1 py-1 text-xs text-center bg-white dark:bg-slate-900 border rounded" />
                    <button onClick={() => addFoodToMealPlan(food._id, quantities[food._id] ?? 100)} className="px-3 py-1.5 bg-primary text-slate-900 text-xs font-bold rounded-lg hover:brightness-110">Thêm</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={deleteModal.isOpen} title="Xóa món ăn" message={`Xóa "${deleteModal.itemName}" khỏi thực đơn?`} confirmText="Xóa" onConfirm={handleRemoveConfirm} onCancel={() => setDeleteModal({ isOpen: false, itemId: '', itemName: '' })} />
    </Layout>
  );
};

export default MealPlannerPage;