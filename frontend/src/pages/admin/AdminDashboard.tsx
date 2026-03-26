import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

// ─── HELPER FORMAT NGÀY THÁNG ───
const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// ─── THAO TÁC NHANH (QUICK LINKS) TRỎ ĐÚNG VÀO ROUTE CỦA ADMIN ───
const quickLinks = [
  {
    title: 'Quản lý Món ăn',
    desc: 'Thêm, sửa, xóa món ăn trong thư viện hệ thống',
    path: '/admin/foods',
    icon: 'restaurant_menu',
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20'
  },
  {
    title: 'Quản lý Bài viết',
    desc: 'Kiểm duyệt nội dung và bài viết từ cộng đồng',
    path: '/admin/posts', 
    icon: 'public',
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20'
  },
  {
    title: 'Quản lý Người dùng',
    desc: 'Xem danh sách, phân quyền hoặc khóa tài khoản',
    path: '/admin/users',
    icon: 'manage_accounts',
    color: 'text-purple-500 bg-purple-100 dark:bg-purple-500/20'
  },
];

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // States lưu trữ dữ liệu thật
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    groups: 0,
    challenges: 0,
    foods: 0
  });

  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // GỌI ĐỒNG THỜI CÁC API ĐỂ LẤY DỮ LIỆU THỐNG KÊ THẬT
        const [usersRes, postsRes, groupsRes, challengesRes, foodsRes] = await Promise.all([
          fetch('http://localhost:8000/api/users', { headers }),
          fetch('http://localhost:8000/api/community/posts', { headers }),
          fetch('http://localhost:8000/api/community/groups', { headers }),
          fetch('http://localhost:8000/api/community/challenges', { headers }),
          // Đặt fallback cho Foods nếu API chưa hoàn thiện
          fetch('http://localhost:8000/api/foods', { headers }).catch(() => ({ ok: false, json: () => [] }))
        ]);

        const usersData = usersRes.ok ? await usersRes.json() : [];
        const postsData = postsRes.ok ? await postsRes.json() : [];
        const groupsData = groupsRes.ok ? await groupsRes.json() : [];
        const challengesData = challengesRes.ok ? await challengesRes.json() : [];
        const foodsData = foodsRes.ok ? await foodsRes.json() : [];

        // Cập nhật thẻ thống kê
        setStats({
          users: Array.isArray(usersData) ? usersData.length : 0,
          posts: Array.isArray(postsData) ? postsData.length : 0,
          groups: Array.isArray(groupsData) ? groupsData.length : 0,
          challenges: Array.isArray(challengesData) ? challengesData.length : 0,
          foods: Array.isArray(foodsData) ? foodsData.length : 0
        });

        // Lấy 4 bài viết mới nhất để Admin theo dõi (Loại bỏ bài của AI nếu muốn)
        if (Array.isArray(postsData)) {
            const userPosts = postsData.filter((p: any) => !p.isAIPost && p.tag !== 'AI Coach').slice(0, 4);
            setRecentPosts(userPosts);
        }

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu Admin Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto w-full pb-10">
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Tổng quan Hệ thống</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Theo dõi các chỉ số và hoạt động mới nhất của HealthMate.</p>
            </div>
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">refresh</span> Làm mới
            </button>
        </div>

        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
               <p className="font-bold">Đang đồng bộ dữ liệu...</p>
           </div>
        ) : (
           <>
              {/* --- STATS GRID --- */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">group</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">group</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người dùng</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.users}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">article</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">article</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bài viết</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.posts}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">diversity_3</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">diversity_3</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hội nhóm</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.groups}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">stars</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">stars</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thử thách</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.challenges}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">restaurant</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">restaurant</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Món ăn</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.foods}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- RECENT ACTIVITY --- */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">dynamic_feed</span> Hoạt động cộng đồng
                            </h2>
                            {/* LINK ĐƯỢC CHỈNH LẠI TRỎ VỀ TRANG QUẢN LÝ BÀI VIẾT CỦA ADMIN */}
                            <Link to="/admin/posts" className="text-xs font-bold text-primary hover:underline">Xem tất cả</Link>
                        </div>
                        <div className="p-0">
                            {recentPosts.length === 0 ? (
                                <p className="text-center text-slate-500 py-10 text-sm">Chưa có bài viết mới nào.</p>
                            ) : (
                                recentPosts.map((post, idx) => (
                                    <div key={post._id} className={`p-5 flex gap-4 items-start ${idx !== recentPosts.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
                                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-slate-200">
                                            <img src={post.user?.profile?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.profile?.full_name || 'User')}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-4">{post.user?.profile?.full_name || 'Unknown User'}</p>
                                                <span className="text-[10px] text-slate-400 font-medium shrink-0">{formatDateTime(post.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-primary font-bold mb-1.5">{post.tag}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{post.content}</p>
                                            
                                            {/* Admin Actions */}
                                            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                                <button className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">delete</span> Xóa bài</button>
                                                <button className="text-[11px] font-bold text-amber-500 hover:text-amber-700 transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">warning</span> Cảnh cáo</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* --- QUICK LINKS --- */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sticky top-24">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">bolt</span> Lối tắt
                        </h2>
                        <div className="space-y-3">
                        {quickLinks.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex items-start gap-4 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                            >
                            <span className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${item.color}`}>
                                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            </span>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{item.title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                            </Link>
                        ))}
                        </div>
                    </div>
                </div>

              </div>
           </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;