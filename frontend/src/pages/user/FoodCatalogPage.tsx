import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

interface Food {
  _id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string | null;
}

const CATEGORIES = ['Tất cả', 'Tinh bột', 'Đạm', 'Rau củ', 'Trái cây', 'Đồ uống', 'Khác'];

const FoodCatalogPage = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<Food[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const getAuthHeaders = () => ({
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchFoods();
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchRecommendedFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'Tất cả') params.append('category', selectedCategory);
      if (search.trim()) params.append('search', search.trim());

      const response = await fetch(`http://localhost:8000/api/foods?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFoods(data);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách món ăn');
    } finally {
      setLoading(false);
    }
  };

  // --- THÊM BỘ NHỚ CACHE CHO AI ---
  const fetchRecommendedFoods = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const cacheKey = 'hm_food_recommendations';
      const cachedStr = localStorage.getItem(cacheKey);

      // Kiểm tra xem đã có gợi ý của ngày hôm nay trong LocalStorage chưa
      if (cachedStr) {
          try {
              const cachedData = JSON.parse(cachedStr);
              if (cachedData.date === todayStr && cachedData.foods && cachedData.foods.length > 0) {
                  setRecommendedFoods(cachedData.foods);
                  return; // Dừng lại, dùng cache ngay lập tức không gọi API
              }
          } catch (e) {
              console.error("Lỗi parse cache", e);
          }
      }

      // Nếu chưa có, gọi AI để tạo
      try {
          setLoadingAI(true);
          const response = await fetch(`http://localhost:8000/api/foods/recommend`, getAuthHeaders());
          if (response.ok) {
              const data = await response.json();
              setRecommendedFoods(data);
              
              // Lưu vào Cache để lần load sau không cần gọi lại
              localStorage.setItem(cacheKey, JSON.stringify({
                  date: todayStr,
                  foods: data
              }));
          }
      } catch (error) {
          console.error("Error loading recommended foods", error);
      } finally {
          setLoadingAI(false);
      }
  };

  // --- LOGIC THÊM MÓN ĂN VÀO THỰC ĐƠN ---
  const handleAddFoodToMealPlan = async (food: Food, slot: string) => {
    const toastId = toast.loading('Đang thêm món ăn...');
    try {
      const todayStr = new Date().toISOString().split('T')[0]; 
      const payload = {
          food_id: food._id,
          name: food.name,
          quantity: 100, 
          calories: food.calories,
          slot: slot
      };

      const res = await fetch(`http://localhost:8000/api/meal-plans/${todayStr}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Đã thêm ${food.name} vào thực đơn!`, { id: toastId });
        navigate('/meal-planner'); 
      } else {
        toast.error('Lỗi khi thêm món ăn', { id: toastId });
      }
    } catch (error) {
      toast.error('Lỗi kết nối', { id: toastId });
    }
  };

  // Component Thẻ món ăn (Food Card) tái sử dụng
  const FoodCard = ({ food, isAI = false }: { food: Food, isAI?: boolean }) => (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-md ${isAI ? 'border-primary/40 dark:border-primary/30' : 'border-slate-200 dark:border-slate-800 hover:border-primary/30'}`}>
          <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden group">
            {food.image ? (
              <img src={`http://localhost:8000${food.image}`} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <span className="material-symbols-outlined text-5xl">restaurant</span>
              </div>
            )}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-widest">
              {food.category}
            </div>
            {isAI && (
                <div className="absolute top-3 right-3 bg-primary text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span> Đề xuất
                </div>
            )}
          </div>
          
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight line-clamp-2 pr-2">{food.name}</h3>
                <div className="text-right shrink-0">
                    <span className="text-lg font-black text-orange-500 block leading-none">{food.calories}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kcal</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 text-center border border-blue-100 dark:border-blue-800/30">
                <div className="text-blue-600 dark:text-blue-400 font-black text-sm">{food.carbs}g</div>
                <div className="text-[10px] text-blue-500 font-semibold uppercase tracking-tighter">Carbs</div>
              </div>
              <div className="bg-primary/10 rounded-xl p-2 text-center border border-primary/20">
                <div className="text-primary font-black text-sm">{food.protein}g</div>
                <div className="text-[10px] text-primary/80 font-semibold uppercase tracking-tighter">Protein</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2 text-center border border-amber-100 dark:border-amber-800/30">
                <div className="text-amber-600 dark:text-amber-400 font-black text-sm">{food.fat}g</div>
                <div className="text-[10px] text-amber-500 font-semibold uppercase tracking-tighter">Fat</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Thêm vào thực đơn (100g)</p>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleAddFoodToMealPlan(food, 'breakfast')} className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-400 rounded-lg text-[11px] font-bold transition-colors">
                    Sáng
                </button>
                <button onClick={() => handleAddFoodToMealPlan(food, 'lunch')} className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg text-[11px] font-bold transition-colors">
                    Trưa
                </button>
                <button onClick={() => handleAddFoodToMealPlan(food, 'dinner')} className="py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 dark:text-violet-400 rounded-lg text-[11px] font-bold transition-colors">
                    Tối
                </button>
                <button onClick={() => handleAddFoodToMealPlan(food, 'snack')} className="py-2 bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 rounded-lg text-[11px] font-bold transition-colors">
                    Phụ
                </button>
              </div>
            </div>
          </div>
      </div>
  );

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 w-full min-h-screen">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Thư viện Ẩm thực</h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Khám phá và thêm hàng trăm món ăn vào thực đơn của bạn.</p>
            </div>
            
            <div className="relative w-full md:w-80 shrink-0">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Tìm món ăn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm"
                />
            </div>
        </div>

        {/* AI Recommendations */}
        {(!search && selectedCategory === 'Tất cả' && (recommendedFoods.length > 0 || loadingAI)) && (
            <div className="mb-12 min-h-[300px]">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gợi ý cho bạn</h2>
                    <span className="bg-primary/20 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ml-2">Smart AI</span>
                </div>
                
                {loadingAI ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-3">refresh</span>
                        <p className="text-sm font-bold text-slate-500 animate-pulse">AI đang chuẩn bị thực đơn phù hợp nhất cho bạn...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recommendedFoods.map(food => (
                            <FoodCard key={`rec-${food._id}`} food={food} isAI={true} />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-6 scrollbar-hide">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === category
                  ? 'bg-slate-900 text-white dark:bg-primary dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Food List */}
        {loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
            <p className="text-slate-500 font-medium">Không tìm thấy món ăn nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {foods.map(food => (
                <FoodCard key={food._id} food={food} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FoodCatalogPage;