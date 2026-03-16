
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

const CATEGORIES = ['Tinh bột', 'Đạm', 'Rau củ', 'Trái cây', 'Đồ uống', 'Khác'];

const AdminFoodFormPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tinh bột',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên món ăn');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('calories', formData.calories || '0');
      formDataToSend.append('protein', formData.protein || '0');
      formDataToSend.append('carbs', formData.carbs || '0');
      formDataToSend.append('fat', formData.fat || '0');

      const response = await fetch('http://localhost:8000/api/foods', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        alert('Tạo món ăn thành công!');
        navigate('/foods');
      } else {
        setError(data.message || 'Lỗi khi tạo món ăn');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Thêm <span className="text-primary">món ăn mới</span>
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Tên món ăn *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Cơm trắng"
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Danh mục *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-medium mb-4">Thông tin dinh dưỡng (per 100g)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Calo (kcal)</label>
                  <input
                    type="number"
                    name="calories"
                    value={formData.calories}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    placeholder="0"
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    name="protein"
                    value={formData.protein}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    placeholder="0"
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    name="carbs"
                    value={formData.carbs}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    placeholder="0"
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    name="fat"
                    value={formData.fat}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    placeholder="0"
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/foods')}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary text-slate-900 rounded-xl font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo món ăn'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AdminFoodFormPage;