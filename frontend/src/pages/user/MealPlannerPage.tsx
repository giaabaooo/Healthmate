import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  _id?: string;
  id?: string;
  food_id?: string;
  name: string;
  category: string;
  calories: number;
}

// 🔴 BỘ CÔNG CỤ XỬ LÝ NGÀY THÁNG CHUẨN LOCAL (Chống nhảy ngày)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getLocalDateString(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dateNum = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateNum}`;
}

const getTodayStr = () => getLocalDateString(new Date());

function formatDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function offsetDate(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
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
  const navigate = useNavigate();
  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [items, setItems] = useState<MealItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔴 KIỂM TRA NGÀY TRONG QUÁ KHỨ ĐỂ VIEW-ONLY
  const isPastDate = selectedDate < todayStr;

  // KIỂM TRA QUYỀN PRO
  const [isProValid, setIsProValid] = useState(false);
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.subscription?.plan === 'pro') {
        const end = new Date(u.subscription.endDate);
        if (end >= new Date()) setIsProValid(true);
      }
    }
  }, []);

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

  useEffect(() => { fetchMealPlan(); fetchAiRecs(); }, [selectedDate, isProValid]); 

  useEffect(() => {
      const analyzeLimit = async () => {
          if (!isProValid) return; 
          
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
  }, [totalCalories, calorieGoal, isProValid]);

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
      data.forEach((f: Food) => { init[f._id!] = 100; });
      setQuantities(init);
    } catch (err) { console.error(err); }
  };

  const fetchAiRecs = async (forceGenerate = false) => {
    if (!isProValid) return; 
    
    if (isPastDate && forceGenerate) {
        return toast.error("Không thể tạo thực đơn cho ngày quá khứ!");
    }

    const cacheKey = `hm_ai_meal_rec_${todayStr}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData && !forceGenerate) {
        setAiRecs(JSON.parse(cachedData));
        return;
    }

    try {
      setLoadingAI(true);
      if (forceGenerate) toast.loading("Đầu bếp AI đang lên thực đơn...", { id: 'ai' });
      const res = await fetch('http://localhost:8000/api/meal-plans/ai/recommend', { headers: getAuthHeaders() });
      const data = await res.json();
      setAiRecs(data || {});
      localStorage.setItem(cacheKey, JSON.stringify(data));
      if (forceGenerate) toast.success("Thực đơn mới đã sẵn sàng!", { id: 'ai' });
    } catch (err) { 
        if (forceGenerate) toast.error("Lỗi tạo thực đơn", { id: 'ai' });
    } finally { 
        setLoadingAI(false); 
    }
  };

  const openFoodModal = (slot: MealSlot) => {
    if (isPastDate) return;
    setTargetSlot(slot);
    fetchFoods();
    setShowFoodModal(true);
  };

  // 🔴 FIX LỖI THÊM MÓN ĂN AI DO SAI ID
  const addFoodToMealPlan = async (item: any, forceSlot?: MealSlot) => {
    if (isPastDate) return toast.error("Không thể thêm vào ngày quá khứ");

    const foodId = item.food_id || item._id || item.id;
    if (!foodId) {
        return toast.error("Dữ liệu món ăn bị lỗi, không tìm thấy ID");
    }

    try {
      const payload = {
          food_id: foodId, 
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
    if (isPastDate) return;
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
    if (isPastDate) return;
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
      <div className="space-y-5 px-4 md:px-8 py-10 max-w-[1400px] mx-auto min-h-screen">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Thực đơn của tôi</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Theo dõi dinh dưỡng hàng ngày</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => isProValid ? fetchAiRecs(true) : navigate('/subscription')} 
              disabled={loadingAI || (isProValid && hasAiLoadedToday) || isPastDate}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm
                ${!isProValid 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 shadow-amber-500/20 hover:scale-105' 
                    : hasAiLoadedToday 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                        : isPastDate ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary/20 text-primary hover:bg-primary hover:text-slate-900'
                }`}
            >
               <span className={`material-symbols-outlined text-lg ${loadingAI ? 'animate-spin' : ''}`}>
                 {!isProValid ? 'workspace_premium' : 'auto_awesome'}
               </span> 
               {!isProValid 
                  ? 'Nâng cấp Pro để dùng AI' 
                  : loadingAI 
                      ? 'Đang tạo...' 
                      : hasAiLoadedToday ? 'Đã tạo menu hôm nay' : 'Đầu bếp AI'
               }
            </button>

            <Link to="/foods" className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-[18px]">restaurant_menu</span> Thư viện
            </Link>
          </div>
        </div>

        {/* --- Date nav --- */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm w-max">
          <button onClick={() => setSelectedDate(d => offsetDate(d, -1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
            <span className="material-symbols-outlined text-slate-500">chevron_left</span>
          </button>
          <button onClick={() => dateInputRef.current?.showPicker?.()} className="min-w-[150px] text-center font-bold text-slate-900 dark:text-white hover:text-primary transition capitalize cursor-pointer relative">
            {formatDate(selectedDate)}
            <input ref={dateInputRef} type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 w-full cursor-pointer" />
          </button>
          <button onClick={() => setSelectedDate(d => offsetDate(d, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
            <span className="material-symbols-outlined text-slate-500">chevron_right</span>
          </button>
          <button onClick={() => setSelectedDate(todayStr)} className="px-4 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer ml-2">
            Hôm nay
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {MEAL_SLOTS.map(slot => {
              const slotItems = grouped[slot.key];
              const slotCals = slotItems.reduce((s, i) => s + i.calories, 0);
              const recs = isProValid ? (aiRecs[slot.key] || []) : []; 

              return (
                <div key={slot.key} className={`rounded-2xl border overflow-hidden shadow-sm ${slot.color}`}>
                  <div className="flex items-center justify-between px-5 py-4 bg-white/40 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shadow-sm ${slot.dot}`} />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-base">{slot.label}</span>
                        <span className="ml-2 text-xs font-medium text-slate-500">{slot.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {slotCals > 0 && <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${slot.badge}`}>{slotCals} kcal</span>}
                      
                      {!isPastDate && (
                          <button onClick={() => openFoodModal(slot.key)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:scale-105 hover:text-primary transition cursor-pointer text-slate-600 dark:text-slate-300">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                      )}
                    </div>
                  </div>

                  {slotItems.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm font-medium text-slate-400 bg-white/30 dark:bg-slate-900/30">
                      Chưa có món nào — nhấn dấu cộng để thêm nhé!
                    </div>
                  ) : (
                    <div className="bg-white/50 dark:bg-slate-900/50 divide-y divide-white/60 dark:divide-slate-700/50">
                      {slotItems.map(item => (
                        <div key={item._id} className="flex items-center gap-4 px-5 py-3 group">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.name}</p>
                            {editingItem === item._id ? (
                              <div className="flex items-center gap-2 mt-1.5">
                                <input type="number" value={editQuantity} onChange={e => setEditQuantity(parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-primary rounded-lg focus:outline-none" autoFocus onKeyDown={e => { if (e.key === 'Enter') updateQuantity(item._id); if (e.key === 'Escape') setEditingItem(null); }} />
                                <span className="text-xs text-slate-500 font-medium">g</span>
                                <button onClick={() => updateQuantity(item._id)} className="text-xs px-2 py-1 bg-primary/20 text-primary font-bold rounded hover:bg-primary hover:text-slate-900 transition">Lưu</button>
                                <button onClick={() => setEditingItem(null)} className="text-xs px-2 py-1 bg-slate-200 text-slate-600 font-bold rounded hover:bg-slate-300 transition">Hủy</button>
                              </div>
                            ) : (
                              <button disabled={isPastDate} onClick={() => { if(!isPastDate) { setEditingItem(item._id); setEditQuantity(item.quantity); } }} className="flex items-center gap-1 mt-1 text-xs font-medium text-slate-500 hover:text-primary transition group/qty">
                                <span>{item.quantity} {item.food_id === "AI_CUSTOM" ? "khẩu phần" : "g"}</span>
                                {!isPastDate && <span className="material-symbols-outlined text-[14px] opacity-0 group-hover/qty:opacity-100 transition">edit</span>}
                              </button>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-black text-base text-primary">{item.calories}</span>
                            <span className="text-xs font-bold text-slate-400 ml-1 uppercase">kcal</span>
                          </div>
                          {!isPastDate && (
                              <button onClick={() => setDeleteModal({ isOpen: true, itemId: item._id, itemName: item.name })} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(!isPastDate && isProValid && recs.length > 0) && (
                    <div className="p-4 bg-white/30 dark:bg-slate-900/30 border-t border-white/50 dark:border-slate-800">
                      <p className="text-xs font-black text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Gợi ý từ Đầu Bếp AI
                      </p>
                      {recs.map((rcm: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-2 hover:border-primary/30 transition-colors">
                           <div className="pr-4 flex-1">
                             <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{rcm.name}</p>
                             <p className="text-xs text-slate-500 mt-1"><span className="text-amber-500 font-bold">{rcm.calories} kcal</span> / khẩu phần</p>
                             <p className="text-[11px] text-primary italic mt-1.5 leading-snug">{rcm.reason}</p>
                           </div>
                           <button onClick={() => addFoodToMealPlan(rcm, slot.key)} className="bg-primary/10 text-primary hover:bg-primary hover:text-slate-900 px-4 py-2 rounded-lg text-xs font-bold transition flex-shrink-0">
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

          <div className="space-y-6">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mục tiêu Calo</p>
                 <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                   <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI Tính Toán
                 </span>
              </div>

              <div className="flex items-center justify-center mb-6 relative">
                <div className="relative w-36 h-36">
                  <svg className="w-36 h-36 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                    <circle cx="56" cy="56" r="44" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - caloriePercent / 100)}`} strokeLinecap="round" className={calorieBarColor} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">{caloriePercent}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCalories}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Đã nạp</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{calorieRemain}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Còn lại</p>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Mục tiêu: <span className="text-primary font-black">{calorieGoal.toLocaleString()}</span> kcal 
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1.5 leading-relaxed">Được AI tính toán tự động dựa trên <br/>cân nặng {userCurrentWeight}kg & mục tiêu cá nhân.</p>
              </div>
            </div>

            {isProValid && aiLimitWarning && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-3xl p-6 animate-fade-in relative overflow-hidden shadow-sm">
                    <div className="absolute right-0 top-0 opacity-10">
                        <span className="material-symbols-outlined text-8xl text-rose-500">warning</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                            <span className="material-symbols-outlined text-[16px]">psychology</span> Phân tích từ AI
                        </p>
                        <p className="text-sm text-rose-800 dark:text-rose-200 font-medium leading-relaxed">
                            {isAnalyzingLimit ? 'Đang phân tích dữ liệu calo...' : aiLimitWarning}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Phân bổ Dưỡng chất (Ước tính)</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5"><span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Carbohydrate (50%)</span><span className="text-xs font-bold dark:text-slate-300">{estCarb}g</span></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-blue-400 rounded-full" style={{ width: '50%' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5"><span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Protein (25%)</span><span className="text-xs font-bold dark:text-slate-300">{estProtein}g</span></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: '25%' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5"><span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Chất béo (25%)</span><span className="text-xs font-bold dark:text-slate-300">{estFat}g</span></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-amber-400 rounded-full" style={{ width: '25%' }} /></div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {showFoodModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Thêm vào: {MEAL_SLOTS.find(s=>s.key===targetSlot)?.label}</h3>
              <button onClick={() => setShowFoodModal(false)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:text-white transition flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input type="text" placeholder="Tìm món ăn..." value={foodSearch} onChange={e => setFoodSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" autoFocus />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3 scrollbar-hide">
              {filteredFoods.map(food => (
                <div key={food._id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 mb-1">
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">{food.name}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{food.calories} kcal/100g {food.category && `• ${food.category}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" value={quantities[food._id!] ?? 100} onChange={e => setQuantities(q => ({ ...q, [food._id!]: parseInt(e.target.value) || 0 }))} className="w-16 px-2 py-1.5 text-sm font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary" />
                    <span className="text-[10px] font-bold text-slate-400">g</span>
                    <button onClick={() => addFoodToMealPlan({ _id: food._id, name: food.name, quantity: quantities[food._id!] ?? 100, calories: Math.round((food.calories * (quantities[food._id!] ?? 100)) / 100) }, targetSlot)} className="ml-2 px-4 py-2 bg-primary text-slate-900 text-xs font-bold rounded-xl hover:brightness-110 shadow-sm transition-all">Thêm</button>
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