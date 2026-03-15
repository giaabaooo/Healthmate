import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google'; // BẮT BUỘC IMPORT CÁI NÀY

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } 
        
        else if (user.profile && user.profile.height_cm && user.profile.weight_kg) {
          navigate('/homepage', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } catch (e) {
        console.error("Lỗi parse thông tin user");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        return;
      }

      // Lưu token và thông tin user vào localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // THÊM KIỂM TRA ADMIN Ở ĐÂY
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (data.user.profile && data.user.profile.height_cm && data.user.profile.weight_kg) {
        navigate('/homepage', { replace: true }); 
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi kết nối tới server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        // 1. Lấy thông tin từ Google
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        // 2. Gửi thông tin Google xuống Backend của bạn
        const beResponse = await fetch('http://localhost:8000/api/users/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userInfo.email,
            full_name: userInfo.name,
            sub: userInfo.sub
          })
        });

        const data = await beResponse.json();

        if (!beResponse.ok) {
          setError(data.message || 'Đăng nhập Google qua Server thất bại.');
          return;
        }

        // 3. Lưu token thật từ Backend
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        
        if (data.user.role === 'admin') {
           navigate('/admin/dashboard', { replace: true });
        }
        
        else if (data.user.profile && data.user.profile.height_cm && data.user.profile.weight_kg) {
          navigate('/homepage', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
        
      } catch (err) {
        setError('Lỗi hệ thống khi đăng nhập bằng Google.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Cửa sổ đăng nhập Google bị đóng hoặc có lỗi.');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-display text-slate-900 dark:text-slate-100">
      
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10">
        
        <div className="text-center mb-8">
          <Link to="/homepage" title="Quay về trang chủ" className="inline-flex items-center justify-center size-12 bg-primary/10 text-primary rounded-full mb-4 hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-3xl">exercise</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Chào mừng trở lại!</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Đăng nhập vào HealthMate để tiếp tục.
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="nhap@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl bg-primary text-slate-900 font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center shadow-lg shadow-primary/20"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center justify-center">
            <hr className="w-full border-slate-200 dark:border-slate-700" />
            <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs text-slate-500 font-medium uppercase tracking-wider">
              Hoặc tiếp tục với
            </span>
          </div>

          {/* CHÚ Ý: Chỗ onClick này đã đổi thành ()=> handleGoogleLogin() */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            className="mt-6 w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google Logo" 
              className="w-5 h-5"
            />
            Google
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;