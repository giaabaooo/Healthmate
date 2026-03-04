import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';

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

const MealPlannerPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [items, setItems] = useState<MealItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  useEffect(() => {
    fetchMealPlan();
  }, [selectedDate]);

  useEffect(() => {
    const addFoodId = searchParams.get('addFood');
    if (addFoodId) {
      handleAddFoodFromUrl(addFoodId);
    }
  }, [searchParams]);

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setItems(data.items || []);
      setTotalCalories(data.total_calories || 0);
    } catch (error) {
      console.error('Lỗi khi tải thực đơn:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/foods');
      const data = await response.json();
      setFoods(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách món ăn:', error);
    }
  };

  const handleAddFoodFromUrl = async (foodId: string) => {
    const quantity = prompt('Nhập số gram:', '100');
    if (quantity) {
      await addFoodToMealPlan(foodId, parseInt(quantity));
    }
  };

  const addFoodToMealPlan = async (foodId: string, quantity: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/meal-plans/${selectedDate}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ food_id: foodId, quantity })
      });

      if (response.ok) {
        fetchMealPlan();
        setShowFoodModal(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Lỗi khi thêm món ăn');
      }
    } catch (error) {
      console.error('Lỗi khi thêm món ăn:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm('Bạn có chắc muốn xóa món này?')) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/meal-plans/${selectedDate}/items/${itemId}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (response.ok) fetchMealPlan();
    } catch (error) {
      console.error('Lỗi khi xóa món ăn:', error);
    }
  };

  const updateQuantity = async (itemId: string) => {
    if (editQuantity <= 0) {
      alert('Số lượng phải lớn hơn 0');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/meal-plans/${selectedDate}/items/${itemId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ quantity: editQuantity })
        }
      );
      if (response.ok) {
        fetchMealPlan();
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng:', error);
    }
  };

  const openFoodModal = () => {
    fetchFoods();
    setShowFoodModal(true);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Thực đơn <span className="text-primary">hôm nay</span>
          </h1>
          <Link
            to="/foods"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Xem thư viện món ăn
          </Link>
        </div>

        {/* Date picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Chọn ngày
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Total calories */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-6 mb-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">Tổng calo</div>
          <div className="text-4xl font-bold text-primary">{totalCalories} kcal</div>
        </div>

        {/* Meal items */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold">Danh sách món ăn</h2>
            <button
              onClick={openFoodModal}
              className="px-4 py-2 bg-primary text-slate-900 rounded-lg font-medium hover:bg-primary/90 transition"
            >
              + Thêm món
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Chưa có món ăn nào. Hãy thêm món ăn vào thực đơn!
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((item) => (
                <div key={item._id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {editingItem === item._id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded"
                        />
                        <span className="text-sm text-slate-500">gram</span>
                        <button onClick={() => updateQuantity(item._id)} className="text-sm text-primary hover:underline">Lưu</button>
                        <button onClick={() => setEditingItem(null)} className="text-sm text-slate-500 hover:underline">Hủy</button>
                      </div>
                    ) : (
                      <div
                        className="text-sm text-slate-500 cursor-pointer hover:text-primary"
                        onClick={() => { setEditingItem(item._id); setEditQuantity(item.quantity); }}
                      >
                        {item.quantity}g (click để sửa)
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-primary">{item.calories}</div>
                      <div className="text-xs text-slate-500">kcal</div>
                    </div>
                    <button
                      onClick={() => removeItem(item._id)}
                      className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Food modal */}
      {showFoodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold">Chọn món ăn</h3>
              <button onClick={() => setShowFoodModal(false)} className="text-slate-500 hover:text-slate-700">X</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {foods.length === 0 ? (
                <div className="text-center text-slate-500 py-4">Không có món ăn nào</div>
              ) : (
                <div className="space-y-2">
                  {foods.map((food) => (
                    <button
                      key={food._id}
                      onClick={() => {
                        const quantity = prompt(`Nhập số gram cho ${food.name}:`, '100');
                        if (quantity) addFoodToMealPlan(food._id, parseInt(quantity));
                      }}
                      className="w-full p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{food.name}</div>
                          <div className="text-xs text-slate-500">{food.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{food.calories}</div>
                          <div className="text-xs text-slate-500">kcal/100g</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MealPlannerPage;
