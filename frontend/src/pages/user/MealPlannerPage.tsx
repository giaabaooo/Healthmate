import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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

function groupBySlot(items: MealItem[]): Record<MealSlot, MealItem[]> {
  const g: Record<MealSlot, MealItem[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  items.forEach((item) => { 
    if(g[item.slot]) g[item.slot].push(item);
    else g['snack'].push(item); 
  });
  return g;
}

const MealPlannerPage = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [items, setItems] = useState<MealItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);

  // Auto Calculation States
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [userGoalType, setUserGoalType] = useState('maintain');
  const [userCurrentWeight, setUserCurrentWeight] = useState(70);

  // AI States
  const [aiRecs, setAiRecs] = useState<any>({});
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiLimitWarning, setAiLimitWarning] = useState("");
  const [isAnalyzingLimit, setIsAnalyzingLimit] = useState(false);
  const prevCal = useRef(0);

  // Modal States
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
  const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

  useEffect(() => {
    const autoCalculateTarget = async () => {
        let goalType = 'maintain';
        try {
            const res = await fetch('http://localhost:8000/api/goals/my-goal', { headers: getAuthHeaders() });
            if(res.ok) {
                const goalData = await res.json();
                if(goalData?.goal_type) goalType = goalData.goal_type;
            }
        } catch (e) {}

        const checkin = JSON.parse(localStorage.getItem('latestBodyCheckin') || "{}");
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        
        const weight = checkin.weight || user.profile?.weight_kg || 70;
        const height = checkin.height || user.profile?.height_cm || 170;
        const gender = user.profile?.gender || 'male';
        const age = 25; 
        
        const bmr = gender === 'male' 
            ? (10 * weight + 6.25 * height - 5 * age + 5) 
            : (10 * weight + 6.25 * height - 5 * age - 161);
        let targetCal = bmr * 1.55;
        
        if (goalType === 'fat_loss') targetCal -= 500;
        else if (goalType === 'muscle_gain') targetCal += 300;

        setCalorieGoal(Math.round(targetCal));
        setUserGoalType(goalType);
        setUserCurrentWeight(weight);
    };
    autoCalculateTarget();
  }, []);

  useEffect(() => { fetchMealPlan(); fetchAiRecs(); }, [selectedDate]);

  useEffect(() => {
      const analyzeLimit = async () => {
          if (totalCalories >= calorieGoal && calorieGoal > 0 && totalCalories !== prevCal.current) {
              prevCal.current = totalCalories;
              setIsAnalyzingLimit(true);
              try {
                  const res = await fetch('http://localhost:8000/api/meal-plans/ai/analyze-calories', {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({ totalCalories, targetCalories: calorieGoal, goalType: userGoalType, currentWeight: userCurrentWeight })
                  });
                  const data = await res.json();
                  if(data.feedback) setAiLimitWarning(data.feedback);
              } catch(e) {}
              finally { setIsAnalyzingLimit(false); }
          } else if (totalCalories < calorieGoal) {
              setAiLimitWarning(""); 
              prevCal.current = totalCalories;
          }
      };

      const timeoutId = setTimeout(analyzeLimit, 1000); 
      return () => clearTimeout(timeoutId);
  }, [totalCalories, calorieGoal]);

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

  const fetchAiRecs = async (forceGenerate = false) => {
    const cacheKey = `hm_ai_meal_rec_${todayStr}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData && !forceGenerate) {
        setAiRecs(JSON.parse(cachedData));
        return;
    }

    try {
      setLoadingAI(true);
      toast.loading("Đầu bếp AI đang lên thực đơn...", { id: 'ai' });
      const res = await fetch('http://localhost:8000/api/meal-plans/ai/recommend', { headers: getAuthHeaders() });
      const data = await res.json();
      setAiRecs(data || {});
      localStorage.setItem(cacheKey, JSON.stringify(data));
      toast.success("Thực đơn mới đã sẵn sàng!", { id: 'ai' });
    } catch (err) { 
        toast.error("Lỗi tạo thực đơn", { id: 'ai' });
    } finally { 
        setLoadingAI(false); 
    }
  };

  const openFoodModal = (slot: MealSlot) => {
    setTargetSlot(slot);
    fetchFoods();
    setShowFoodModal(true);
  };

  const addFoodToMealPlan = async (item: any, forceSlot?: MealSlot) => {
    try {
      const payload = {
          food_id: item.food_id || item._id || "AI_CUSTOM", 
          name: item.name,
          quantity: item.quantity || 100, 
          calories: item.calories,
          slot: forceSlot || targetSlot
      };

      const res = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload), 
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
    if (editQuantity <= 0 || editQuantity > 5000) { toast.error('Số lượng không hợp lệ'); return; }
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

  const hasAiLoadedToday = !!localStorage.getItem(`hm_ai_meal_rec_${todayStr}`);

  return (
    <Layout>
      <div className="space-y-5">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thực đơn của tôi</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi dinh dưỡng hàng ngày</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchAiRecs(true)} 
              disabled={loadingAI || hasAiLoadedToday}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all ${hasAiLoadedToday ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-primary/20 text-primary hover:bg-primary hover:text-slate-900'}`}>
               <span className={`material-symbols-outlined text-lg ${loadingAI ? 'animate-spin' : ''}`}>auto_awesome</span> 
               {loadingAI ? 'Đang tạo...' : hasAiLoadedToday ? 'Đã tạo menu hôm nay' : 'Làm mới AI'}
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
                                <span>{item.quantity} {item.food_id === "AI_CUSTOM" ? "khẩu phần" : "g"}</span>
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

                  {recs.length > 0 && (
                    <div className="p-3 bg-white/30 dark:bg-slate-900/30 border-t border-white/50 dark:border-slate-800">
                      <p className="text-xs font-black text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span> Gợi ý từ Đầu Bếp AI
                      </p>
                      {recs.map((rcm: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mb-2">
                           <div className="pr-4">
                             <p className="text-sm font-bold dark:text-white">{rcm.name}</p>
                             <p className="text-[11px] text-slate-500 mt-0.5"><span className="text-amber-500 font-medium">{rcm.calories} kcal</span> / khẩu phần</p>
                             <p className="text-[10px] text-primary italic mt-1">{rcm.reason}</p>
                           </div>
                           <button onClick={() => addFoodToMealPlan(rcm, slot.key)} className="bg-primary/20 text-primary hover:bg-primary hover:text-slate-900 px-3 py-1.5 rounded text-xs font-bold transition flex-shrink-0">
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
                 <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                   <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI Tự động
                 </span>
              </div>

              <div className="flex items-center justify-center mb-4 relative">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                    <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - caloriePercent / 100)}`} strokeLinecap="round" className={calorieBarColor} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{caloriePercent}%</span>
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

              <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    Mục tiêu: {calorieGoal.toLocaleString()} kcal 
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Được tính toán dựa trên {userCurrentWeight}kg & lộ trình cá nhân.</p>
              </div>
            </div>

            {aiLimitWarning && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 animate-fade-in relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10">
                        <span className="material-symbols-outlined text-6xl text-rose-500">warning</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                            <span className="material-symbols-outlined text-[14px]">psychology</span> Phân tích từ AI
                        </p>
                        <p className="text-sm text-rose-800 dark:text-rose-200 font-medium leading-relaxed">
                            {isAnalyzingLimit ? 'Đang phân tích...' : aiLimitWarning}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Phân bổ Dưỡng chất (Ước tính)</p>
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
                    <button onClick={() => addFoodToMealPlan({ _id: food._id, name: food.name, quantity: quantities[food._id] ?? 100, calories: Math.round((food.calories * (quantities[food._id] ?? 100)) / 100) }, targetSlot)} className="px-3 py-1.5 bg-primary text-slate-900 text-xs font-bold rounded-lg hover:brightness-110">Thêm</button>
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