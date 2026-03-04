import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';

interface Food {
  _id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const CATEGORIES = ['Tất cả', 'Tinh bột', 'Đạm', 'Rau củ', 'Trái cây', 'Đồ uống', 'Khác'];

const FoodCatalogPage = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  useEffect(() => {
    fetchFoods();
  }, [selectedCategory, search]);

  const fetchFoods = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'Tất cả') {
        params.append('category', selectedCategory);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`http://localhost:8000/api/foods?${params.toString()}`);
      const data = await response.json();
      setFoods(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách món ăn:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Thư viện <span className="text-primary">Món ăn</span>
          </h1>
          <Link
            to="/meal-planner"
            className="px-4 py-2 bg-primary text-slate-900 rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Lên thực đơn
          </Link>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm món ăn..."
            className="w-full md:w-96 bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-primary text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Food grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải...</div>
        ) : foods.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Không tìm thấy món ăn nào
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foods.map((food) => (
              <div
                key={food._id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{food.name}</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {food.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{food.calories}</div>
                    <div className="text-xs text-slate-500">kcal/100g</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <div className="font-semibold">{food.protein}g</div>
                    <div className="text-xs text-slate-500">Protein</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <div className="font-semibold">{food.carbs}g</div>
                    <div className="text-xs text-slate-500">Carbs</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <div className="font-semibold">{food.fat}g</div>
                    <div className="text-xs text-slate-500">Fat</div>
                  </div>
                </div>

                <Link
                  to={`/meal-planner?addFood=${food._id}`}
                  className="mt-4 w-full block text-center py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition"
                >
                  Thêm vào thực đơn
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FoodCatalogPage;
