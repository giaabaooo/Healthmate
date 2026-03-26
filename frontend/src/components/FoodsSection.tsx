import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ConfirmModal from './confirm-modal';
import FoodFormModal from './FoodFormModal';

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

interface FoodsSectionProps {
  onBack: () => void;
}

const CATEGORIES = ['Tất cả', 'Tinh bột', 'Đạm', 'Rau củ', 'Trái cây', 'Đồ uống', 'Khác'];

const FoodsSection: React.FC<FoodsSectionProps> = ({ onBack }) => {
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

      const response = await fetch(`https://healthmate.onrender.com/api/foods?${params.toString()}`);
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
      const response = await fetch(`https://healthmate.onrender.com/api/foods/${deleteModal.foodId}`, {
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
    <div className="max-w-7xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#28392e] hover:bg-[#344b3c] text-text-dim hover:text-white transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <div>
          <h2 className="text-white text-2xl font-bold">Foods Management</h2>
          <p className="text-text-dim text-sm">Manage food catalog and nutritional data</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-background-dark rounded-lg font-medium transition-colors text-sm shadow-[0_0_15px_rgba(19,236,91,0.3)]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm món ăn
          </button>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="p-6 rounded-xl bg-surface-dark border border-[#28392e] mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm món ăn..."
            className="w-full md:w-80 bg-[#112218] border border-[#28392e] rounded-lg py-2.5 px-4 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  selectedCategory === category
                    ? 'bg-primary text-background-dark'
                    : 'bg-[#28392e] border border-[#28392e] text-text-dim hover:text-white hover:border-primary/30'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Food grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-xl bg-surface-dark border border-[#28392e]">
          <span className="material-symbols-outlined text-4xl text-text-dim mb-2">restaurant</span>
          <p className="text-text-dim">Không tìm thấy món ăn nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {foods.map((food) => (
            <div
              key={food._id}
              className="bg-surface-dark rounded-xl border border-[#28392e] overflow-hidden hover:border-primary/30 transition-all"
            >
              {/* Ảnh */}
              <div className="w-full h-32 bg-[#112218] flex items-center justify-center overflow-hidden">
                {food.image ? (
                  <img
                    src={`https://healthmate.onrender.com${food.image}`}
                    alt={food.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-text-dim">restaurant</span>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{food.name}</h3>
                    <span className="text-xs text-text-dim bg-[#28392e] px-2 py-0.5 rounded mt-0.5 inline-block">
                      {food.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">{food.calories}</div>
                    <div className="text-xs text-text-dim">kcal/100g</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="bg-[#112218] rounded-lg p-2">
                    <div className="text-white font-semibold">{food.protein}g</div>
                    <div className="text-text-dim">Protein</div>
                  </div>
                  <div className="bg-[#112218] rounded-lg p-2">
                    <div className="text-white font-semibold">{food.carbs}g</div>
                    <div className="text-text-dim">Carbs</div>
                  </div>
                  <div className="bg-[#112218] rounded-lg p-2">
                    <div className="text-white font-semibold">{food.fat}g</div>
                    <div className="text-text-dim">Fat</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(food._id)}
                    className="flex-1 text-center py-1.5 text-sm bg-[#28392e] text-text-dim rounded-lg hover:bg-[#344b3c] hover:text-white transition"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDeleteClick(food)}
                    className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
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
    </div>
  );
};

export default FoodsSection;
