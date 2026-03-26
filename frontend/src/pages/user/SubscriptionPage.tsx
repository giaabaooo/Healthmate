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

  useEffect(() => {
    loadUser();
    window.addEventListener('user-updated', loadUser);
    return () => window.removeEventListener('user-updated', loadUser);
  }, []);

  const isPro = user?.subscription?.plan === 'pro';
  const proEndDate = isPro ? new Date(user.subscription.endDate) : null;
  const isActivePro = isPro && proEndDate && proEndDate > new Date();

  // ─── XỬ LÝ KHI PAYOS TRẢ NGƯỜI DÙNG VỀ TRANG NÀY ───
  useEffect(() => {
    // PayOS có thể trả về status=CANCELLED, cancel=true, hoặc status=success/PAID
    const status = searchParams.get('status');
    const isCancel = searchParams.get('cancel') === 'true' || status === 'CANCELLED' || status === 'cancel';
    const isSuccess = status === 'success' || status === 'PAID';

    if (isSuccess) {
      // 1. Dọn dẹp URL ngay lập tức để người dùng F5 không bị gọi lại API
      navigate('/subscription', { replace: true });
      // 2. Gọi hàm xác nhận nâng cấp
      confirmUpgradeSuccess();
    } else if (isCancel) {
      // 1. Dọn dẹp URL ngay lập tức
      navigate('/subscription', { replace: true });
      // 2. Báo lỗi cho người dùng
      toast.error('Bạn đã hủy quá trình thanh toán.', { id: 'payment' });
    }
  }, [searchParams, navigate]);

  // HÀM: Chốt nâng cấp vào DB sau khi thanh toán PayOS báo thành công
  const confirmUpgradeSuccess = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    toast.loading("Đang xác nhận giao dịch...", { id: 'payment' });

    try {
      const res = await fetch('https://healthmate.onrender.com/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('user-updated'));
        
        toast.success("Thanh toán thành công! Chào mừng bạn đến với gói Pro.", { id: 'payment' });
        
        // Sau khi báo thành công, đưa người dùng về trang Overview
        setTimeout(() => navigate('/overview'), 2000);
      }
    } catch (error) {
      toast.error("Lỗi cập nhật dữ liệu. Vui lòng liên hệ Admin.", { id: 'payment' });
    }
  };

  // HÀM: Khi bấm nút "Nâng cấp" -> Xin link PayOS và chuyển hướng
  const handleUpgradeClick = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    setLoading(true);
    toast.loading("Đang khởi tạo cổng thanh toán PayOS...", { id: 'upgrade' });

    try {
      const res = await fetch('https://healthmate.onrender.com/api/subscriptions/create-payment-link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Đang chuyển hướng...", { id: 'upgrade' });
        // Chuyển hướng người dùng sang trang quét mã QR của PayOS
        window.location.href = data.checkoutUrl; 
      } else {
        toast.error("Không thể tạo link thanh toán.", { id: 'upgrade' });
        setLoading(false);
      }
    } catch (error) {
      toast.error("Lỗi kết nối mạng.", { id: 'upgrade' });
      setLoading(false);
    }
  };

  // Hàm Hạ cấp
  const handleDowngrade = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    if (!window.confirm("Bạn có chắc chắn muốn hủy gói Pro và trở về gói Free không? Các tính năng AI sẽ bị khóa lại.")) {
        return;
    }

    setLoading(true);
    toast.loading("Đang hủy gói Pro...", { id: 'downgrade' });

    try {
      const res = await fetch('https://healthmate.onrender.com/api/subscriptions/downgrade', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('user-updated'));
        
        toast.success("Đã hủy gói Pro và trở về gói Free.", { id: 'downgrade' });
        setTimeout(() => navigate('/overview'), 1500);
      } else {
        toast.error("Có lỗi xảy ra khi hủy gói.", { id: 'downgrade' });
      }
    } catch (error) {
      toast.error("Lỗi kết nối mạng.", { id: 'downgrade' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] py-12 px-6 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Nâng cấp trải nghiệm của bạn</h1>
          <p className="text-slate-500 text-lg mb-10">Mở khóa sức mạnh của AI và theo dõi lộ trình chuyên sâu.</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
            {/* Gói Free */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm opacity-80 flex flex-col">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Basic (Free)</h2>
              <p className="text-4xl font-black text-slate-900 dark:text-white mb-6">0đ <span className="text-sm text-slate-500 font-medium">/tháng</span></p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><span className="material-symbols-outlined text-green-500">check_circle</span> Xem danh sách bài tập</li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><span className="material-symbols-outlined text-green-500">check_circle</span> Tạo thực đơn cơ bản</li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><span className="material-symbols-outlined text-green-500">check_circle</span> Tham gia cộng đồng</li>
                <li className="flex items-center gap-3 text-slate-400 dark:text-slate-600"><span className="material-symbols-outlined text-slate-300">cancel</span> Không có AI Coach</li>
                <li className="flex items-center gap-3 text-slate-400 dark:text-slate-600"><span className="material-symbols-outlined text-slate-300">cancel</span> Không có Lộ trình (Fitness Goal)</li>
              </ul>
              
              {!isActivePro ? (
                  <button disabled className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold cursor-not-allowed">Đang sử dụng</button>
              ) : (
                  <button 
                    onClick={handleDowngrade} 
                    disabled={loading} 
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-500 border border-red-200 dark:border-red-800 rounded-xl font-bold transition-all"
                  >
                    Hủy gói Pro (Về Free)
                  </button>
              )}
            </div>

            {/* Gói Pro */}
            <div className="bg-[#111827] rounded-3xl p-8 border-2 border-primary shadow-xl shadow-primary/20 relative overflow-hidden transform md:-translate-y-4 flex flex-col">
              <div className="absolute top-0 right-0 bg-primary text-slate-900 text-xs font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">Phổ biến nhất</div>
              <h2 className="text-2xl font-bold text-white mb-2">HealthMate Pro</h2>
              <p className="text-4xl font-black text-primary mb-6">59.000đ <span className="text-sm text-slate-400 font-medium">/tháng</span></p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300"><span className="material-symbols-outlined text-primary">check_circle</span> Mọi tính năng của gói Free</li>
                <li className="flex items-center gap-3 text-white font-bold"><span className="material-symbols-outlined text-primary">check_circle</span> Trợ lý ảo AI Coach 24/7</li>
                <li className="flex items-center gap-3 text-white font-bold"><span className="material-symbols-outlined text-primary">check_circle</span> Lộ trình mục tiêu (Fitness Goals)</li>
                <li className="flex items-center gap-3 text-white font-bold"><span className="material-symbols-outlined text-primary">check_circle</span> AI thiết kế thực đơn tự động</li>
              </ul>
              
              <button 
                onClick={handleUpgradeClick}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 ${isActivePro ? 'bg-primary/20 text-primary hover:bg-primary/40' : 'bg-primary text-slate-900 hover:brightness-110'}`}
              >
                {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
                {isActivePro ? 'Gia hạn gói Pro (+30 ngày)' : 'Nâng cấp qua PayOS'}
              </button>
              {isActivePro && <p className="text-center text-xs text-slate-400 mt-3">Hạn sử dụng hiện tại: {proEndDate?.toLocaleDateString('vi-VN')}</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;