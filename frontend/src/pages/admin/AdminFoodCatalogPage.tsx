import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/confirm-modal';
import FoodFormModal from '../../components/FoodFormModal';

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

const AdminFoodCatalogPage = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    foodId: string;
    foodName: string;
  }>({ isOpen: false, foodId: '', foodName: '' });
  const [foodModal, setFoodModal] = useState<{
    isOpen: boolean;
    foodId: string | null;
  }>({ isOpen: false, foodId: null });

  useEffect(() => {
    fetchFoods();
  }, [selectedCategory, search]);

  const fetchFoods = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'Tất cả') params.append('category', selectedCategory);
      if (search.trim()) params.append('search', search.trim());

      const response = await fetch(`http://localhost:8000/api/foods?${params.toString()}`);
      const data = await response.json();
      setFoods(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách món ăn:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (food: Food) => {
    setDeleteModal({ isOpen: true, foodId: food._id, foodName: food.name });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/foods/${deleteModal.foodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        toast.success(`Đã xóa "${deleteModal.foodName}"`);
        fetchFoods();
      } else {
        toast.error('Lỗi khi xóa món ăn');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setDeleteModal({ isOpen: false, foodId: '', foodName: '' });
    }
  };

  const openCreateModal = () => setFoodModal({ isOpen: true, foodId: null });
  const openEditModal = (id: string) => setFoodModal({ isOpen: true, foodId: id });
  const closeModal = () => setFoodModal({ isOpen: false, foodId: null });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh sách món ăn</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-slate-900 rounded-lg font-medium hover:bg-primary/90 transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm món ăn
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm món ăn..."
          className="w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedCategory === category
                ? 'bg-primary text-slate-900'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/40'
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
        <div className="text-center py-12 text-slate-500">Không tìm thấy món ăn nào</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {foods.map((food) => (
            <div
              key={food._id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition"
            >
              {/* Ảnh */}
              <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {food.image ? (
                  <img
                    src={`http://localhost:8000${food.image}`}
                    alt={food.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{food.name}</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-0.5 inline-block">
                      {food.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">{food.calories}</div>
                    <div className="text-xs text-slate-500">kcal/100g</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <div className="font-semibold">{food.protein}g</div>
                    <div className="text-slate-500">Protein</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <div className="font-semibold">{food.carbs}g</div>
                    <div className="text-slate-500">Carbs</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <div className="font-semibold">{food.fat}g</div>
                    <div className="text-slate-500">Fat</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(food._id)}
                    className="flex-1 text-center py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDeleteClick(food)}
                    className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Xóa món ăn"
        message={`Bạn có chắc muốn xóa "${deleteModal.foodName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, foodId: '', foodName: '' })}
      />

      <FoodFormModal
        isOpen={foodModal.isOpen}
        foodId={foodModal.foodId}
        onClose={closeModal}
        onSuccess={fetchFoods}
      />
    </AdminLayout>
  );
};

export default AdminFoodCatalogPage;
