import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<'muscle_gain' | 'fat_loss' | 'maintain' | ''>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- FRONTEND VALIDATION ---
    if (!gender || !height || !weight || !goal) {
      toast.error('Vui lòng điền đầy đủ thông tin để AI có thể tư vấn tốt nhất.');
      return;
    }
    
    const h = Number(height);
    const w = Number(weight);
    
    if (isNaN(h) || h < 50 || h > 250) {
      toast.error('Chiều cao không hợp lệ (Giới hạn: 50 - 250 cm).');
      return;
    }
    
    if (isNaN(w) || w < 20 || w > 300) {
      toast.error('Cân nặng không hợp lệ (Giới hạn: 20 - 300 kg).');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Gọi đúng API cập nhật profile (Thay vì /api/users/me)
      const response = await fetch('https://healthmate-y9vt.onrender.com/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profile: {
            gender,
            height_cm: h,
            weight_kg: w,
            goal
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Không thể lưu hồ sơ vào hệ thống.');
        setLoading(false);
        return;
      }

      // Cập nhật lại localStorage với data xịn từ DB
      const userStr = localStorage.getItem('user');
      if (userStr) {
          const user = JSON.parse(userStr);
          user.profile = { ...user.profile, ...data.profile }; // Cập nhật profile mới nhất
          localStorage.setItem('user', JSON.stringify(user));
      }
      
      toast.success('Thiết lập hồ sơ thành công!');
      
      // Chuyển hướng người dùng vào trang chủ sau khi hoàn tất thiết lập
      setTimeout(() => {
          navigate('/homepage', { replace: true });
      }, 1000);

    } catch (err) {
      toast.error('Có lỗi xảy ra kết nối với máy chủ, vui lòng thử lại.');
      setLoading(false);
    } 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-display">
      <Toaster position="top-right" />
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Hoàn thiện hồ sơ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Giúp AI Coach hiểu rõ cơ thể bạn để đưa ra lộ trình phù hợp nhất.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Giới tính</label>
              <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-colors" value={gender} onChange={(e) => setGender(e.target.value as any)}>
                <option value="">Chọn...</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Mục tiêu</label>
              <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-colors" value={goal} onChange={(e) => setGoal(e.target.value as any)}>
                <option value="">Chọn...</option>
                <option value="muscle_gain">Tăng cơ</option>
                <option value="fat_loss">Giảm mỡ</option>
                <option value="maintain">Duy trì</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Chiều cao (cm)</label>
              <input type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-colors" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Cân nặng (kg)</label>
              <input type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-colors" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full h-11 mt-6 rounded-xl bg-primary text-slate-900 font-bold text-sm hover:brightness-105 disabled:opacity-60 transition-all flex justify-center items-center gap-2 shadow-sm">
            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
            Hoàn tất & Bắt đầu
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;