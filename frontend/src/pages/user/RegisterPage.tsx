import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate cơ bản
    if (!email || !password || !fullName) {
      setError('Vui lòng nhập đầy đủ họ tên, email và mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, profile: { full_name: fullName } })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
        return;
      }

      // Đăng ký thành công -> Lưu token -> Chuyển sang trang nhập thông tin
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/onboarding'); // <--- ĐÁ SANG TRANG NHẬP THÔNG TIN
      
    } catch (err) {
      setError('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  // Nút Google Login thực sự hoạt động
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // Ở đây thường bạn sẽ gửi tokenResponse.access_token xuống Backend để Backend tạo user
      console.log("Google Token:", tokenResponse);
      alert("Lấy token Google thành công! Đang chờ ghép nối với Backend.");
      // Giả lập đăng nhập thành công -> Chuyển qua onboarding
      navigate('/onboarding'); 
    },
    onError: () => {
      setError('Đăng nhập Google thất bại');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-display text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10">
        <div className="text-center mb-8">
          <Link to="/homepage" title="Quay về trang chủ" className="inline-flex items-center justify-center size-12 bg-primary/10 text-primary rounded-full mb-4 hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-3xl">exercise</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Tạo tài khoản</h1>
          <p className="text-sm text-slate-500">Gia nhập HealthMate ngay hôm nay</p>
        </div>

        {error && <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Họ và Tên</label>
            <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Email</label>
            <input type="email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nhap@email.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Mật khẩu</label>
            <input type="password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Nhập lại mật khẩu</label>
            <input type="password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="w-full h-11 mt-4 rounded-xl bg-primary text-slate-900 font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center shadow-lg shadow-primary/20">
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center justify-center">
            <hr className="w-full border-slate-200" />
            <span className="absolute bg-white px-3 text-xs text-slate-500 font-medium uppercase">Hoặc đăng ký bằng</span>
          </div>
          <button onClick={() => handleGoogleLogin()} className="mt-6 w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" className="w-5 h-5"/>
            Google
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Đã có tài khoản? <Link to="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;