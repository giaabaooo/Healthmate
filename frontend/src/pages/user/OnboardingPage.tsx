import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<'muscle_gain' | 'fat_loss' | 'maintain' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!gender || !height || !weight || !goal) {
      setError('Vui lòng điền đầy đủ thông tin để AI có thể tư vấn tốt nhất.');
      return;
    }
    if (Number(height) <= 50 || Number(weight) <= 20) {
      setError('Chiều cao hoặc cân nặng không hợp lệ.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Gọi API cập nhật thông tin về Backend
      const response = await fetch('http://localhost:8000/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Gửi kèm token
        },
        body: JSON.stringify({
          profile: {
            gender,
            height_cm: Number(height),
            weight_kg: Number(weight),
            goal
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Không thể lưu hồ sơ vào hệ thống.');
        return;
      }

      // Cập nhật lại localStorage với data xịn từ DB
      const userStr = localStorage.getItem('user');
      if (userStr) {
          const user = JSON.parse(userStr);
          user.profile = data.profile; // Ghi đè profile mới
          localStorage.setItem('user', JSON.stringify(user));
      }
      
      navigate('/homepage', { replace: true });
    } catch (err) {
      setError('Có lỗi xảy ra kết nối với máy chủ, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-display">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-slate-900">Hoàn thiện hồ sơ</h1>
          <p className="text-sm text-slate-500">Giúp AI Coach hiểu rõ cơ thể bạn để đưa ra lộ trình phù hợp nhất.</p>
        </div>

        {error && <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Giới tính</label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={gender} onChange={(e) => setGender(e.target.value as any)}>
                <option value="">Chọn...</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Mục tiêu</label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={goal} onChange={(e) => setGoal(e.target.value as any)}>
                <option value="">Chọn...</option>
                <option value="muscle_gain">Tăng cơ</option>
                <option value="fat_loss">Giảm mỡ</option>
                <option value="maintain">Duy trì</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Chiều cao (cm)</label>
              <input type="number" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Cân nặng (kg)</label>
              <input type="number" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full h-11 mt-6 rounded-xl bg-primary text-slate-900 font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
            Hoàn tất & Bắt đầu
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;