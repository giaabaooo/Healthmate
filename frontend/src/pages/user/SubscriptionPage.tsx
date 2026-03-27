import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import toast, { Toaster } from 'react-hot-toast';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const loadUser = () => {
    const userString = localStorage.getItem('user');
    setUser(userString ? JSON.parse(userString) : null);
  };

  // ĐỒNG BỘ GÓI CƯỚC TỪ BACKEND ĐỂ CHỐNG LỖI HIỂN THỊ
  const syncUserFromServer = async () => {
      try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const res = await fetch('https://healthmate-y9vt.onrender.com/api/users/me', {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              const localUser = JSON.parse(localStorage.getItem('user') || '{}');
              
              if (data.subscription) {
                  localUser.subscription = data.subscription;
                  localStorage.setItem('user', JSON.stringify(localUser));
                  setUser(localUser);
              }
          }
      } catch (e) {
          console.error("Lỗi đồng bộ gói Pro:", e);
      }
  };

  useEffect(() => {
    loadUser();
    syncUserFromServer();
    window.addEventListener('user-updated', loadUser);
    return () => window.removeEventListener('user-updated', loadUser);
  }, []);

  const isPro = user?.subscription?.plan === 'pro';
  const proEndDate = isPro && user?.subscription?.endDate ? new Date(user.subscription.endDate) : null;
  const isActivePro = isPro && proEndDate && proEndDate > new Date();

  useEffect(() => {
    const status = searchParams.get('status');
    const isCancel = searchParams.get('cancel') === 'true' || status === 'CANCELLED' || status === 'cancel';
    const isSuccess = status === 'success' || status === 'PAID';

    if (isSuccess) {
      toast.success('Thanh toán thành công! Đang kích hoạt gói Pro...', { id: 'payment' });
      handleSuccessPayment();
    } else if (isCancel) {
      toast.error('Bạn đã hủy thanh toán.', { id: 'payment' });
      navigate('/subscription', { replace: true });
    }
  }, [searchParams]);

  const handleSuccessPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://healthmate-y9vt.onrender.com/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        window.dispatchEvent(new Event('user-updated'));
        toast.success('Đã kích hoạt gói HealthMate Pro!', { id: 'payment' });
        navigate('/subscription', { replace: true });
      }
    } catch (error) {
      toast.error('Lỗi kích hoạt. Vui lòng liên hệ hỗ trợ.', { id: 'payment' });
    }
  };

  const handleUpgradeClick = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://healthmate-y9vt.onrender.com/api/subscriptions/create-payment-link', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.message || 'Không thể tạo link thanh toán');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="flex-1 p-8 max-w-[1000px] mx-auto w-full font-['Inter'] animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Nâng cấp tài khoản</h1>
          <p className="text-slate-500 mt-2">Mở khóa toàn bộ quyền năng của AI Coach để đạt mục tiêu nhanh nhất.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* GÓI FREE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <div className="mb-6">
              <h2 className="text-2xl font-black dark:text-white mb-2">Basic</h2>
              <p className="text-slate-500 text-sm">Trải nghiệm các tính năng cơ bản</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black dark:text-white">0đ</span>
              <span className="text-slate-500 font-medium">/mãi mãi</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><span className="material-symbols-outlined text-green-500">check_circle</span> Theo dõi chỉ số cơ thể</li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><span className="material-symbols-outlined text-green-500">check_circle</span> Thư viện Workout & Món ăn</li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><span className="material-symbols-outlined text-green-500">check_circle</span> Lập kế hoạch tuần cơ bản</li>
              <li className="flex items-center gap-3 text-slate-400"><span className="material-symbols-outlined">cancel</span> AI tạo lộ trình Mục tiêu</li>
              <li className="flex items-center gap-3 text-slate-400"><span className="material-symbols-outlined">cancel</span> Trợ lý ảo AI Coach 24/7</li>
            </ul>
            <button disabled className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold cursor-not-allowed">
              Đang sử dụng
            </button>
          </div>

          {/* GÓI PRO */}
          <div className="bg-slate-900 rounded-3xl p-8 border border-primary relative overflow-hidden shadow-2xl shadow-primary/20 transform md:-translate-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute top-4 right-4 bg-primary text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Khuyên dùng</div>
            
            <div className="mb-6 relative z-10">
              <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">workspace_premium</span> Pro
              </h2>
              <p className="text-slate-400 text-sm">Đồng hành cùng AI Coach thông minh</p>
            </div>
            <div className="mb-8 relative z-10">
              <span className="text-4xl font-black text-white">59.000đ</span>
              <span className="text-slate-400 font-medium">/tháng</span>
            </div>
            <ul className="space-y-4 mb-8 relative z-10">
              <li className="flex items-center gap-3 text-slate-300"><span className="material-symbols-outlined text-primary">check_circle</span> Mọi tính năng của gói Free</li>
              <li className="flex items-center gap-3 text-white font-bold"><span className="material-symbols-outlined text-primary">check_circle</span> Trợ lý ảo AI Coach 24/7</li>
              <li className="flex items-center gap-3 text-white font-bold"><span className="material-symbols-outlined text-primary">check_circle</span> Lộ trình mục tiêu (Fitness Goals)</li>
              <li className="flex items-center gap-3 text-white font-bold"><span className="material-symbols-outlined text-primary">check_circle</span> AI thiết kế thực đơn tự động</li>
            </ul>
            
            <button 
              onClick={handleUpgradeClick}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 relative z-10 ${isActivePro ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50' : 'bg-primary text-slate-900 hover:brightness-110'}`}
            >
              {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
              {isActivePro ? 'Gia hạn gói Pro (+30 ngày)' : 'Nâng cấp qua PayOS'}
            </button>
            
            {isActivePro && (
                <p className="text-center text-xs text-slate-400 mt-4 relative z-10">
                    Hạn sử dụng hiện tại: <span className="text-white font-bold">{proEndDate?.toLocaleDateString('vi-VN')}</span>
                </p>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;