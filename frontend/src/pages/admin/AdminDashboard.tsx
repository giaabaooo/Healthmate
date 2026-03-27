import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

// ─── HELPER FORMAT NGÀY THÁNG ───
const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const quickLinks = [
  { title: 'Quản lý Món ăn', desc: 'Thêm, sửa, xóa món ăn trong thư viện hệ thống', path: '/admin/foods', icon: 'restaurant_menu', color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20' },
  { title: 'Quản lý Bài viết', desc: 'Kiểm duyệt nội dung và bài viết từ cộng đồng', path: '/admin/posts', icon: 'public', color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20' },
  { title: 'Quản lý Người dùng', desc: 'Xem danh sách, phân quyền hoặc khóa tài khoản', path: '/admin/users', icon: 'manage_accounts', color: 'text-purple-500 bg-purple-100 dark:bg-purple-500/20' },
];

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://healthmate-y9vt.onrender.com');

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ users: 0, posts: 0, groups: 0, challenges: 0, foods: 0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  
  // Dữ liệu cho Biểu đồ
  const [userChartData, setUserChartData] = useState<any[]>([]);
  const [contentChartData, setContentChartData] = useState<any[]>([]);

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

        const [usersRes, postsRes, groupsRes, challengesRes, foodsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/users`, { headers }),
          fetch(`${API_URL}/api/community/posts`, { headers }),
          fetch(`${API_URL}/api/community/groups`, { headers }),
          fetch(`${API_URL}/api/community/challenges`, { headers }),
          fetch(`${API_URL}/api/foods`, { headers }).catch(() => ({ ok: false, json: () => [] }))
        ]);

        const usersDataResponse = usersRes.ok ? await usersRes.json() : [];
        const usersData = usersDataResponse.users || usersDataResponse; // Tuỳ chuẩn trả về
        const postsData = postsRes.ok ? await postsRes.json() : [];
        const groupsData = groupsRes.ok ? await groupsRes.json() : [];
        const challengesData = challengesRes.ok ? await challengesRes.json() : [];
        const foodsData = foodsRes.ok ? await foodsRes.json() : [];

        // 1. Cập nhật thẻ thống kê
        setStats({
          users: Array.isArray(usersData) ? usersData.length : 0,
          posts: Array.isArray(postsData) ? postsData.length : 0,
          groups: Array.isArray(groupsData) ? groupsData.length : 0,
          challenges: Array.isArray(challengesData) ? challengesData.length : 0,
          foods: Array.isArray(foodsData) ? foodsData.length : 0
        });

        // 2. Xử lý dữ liệu cho Biểu đồ Tròn (Trạng thái người dùng)
        if (Array.isArray(usersData)) {
            let active = 0, inactive = 0, banned = 0;
            usersData.forEach((u: any) => {
                if (u.status === 'banned') banned++;
                else if (u.status === 'inactive') inactive++;
                else active++; // Default là active
            });
            setUserChartData([
                { name: 'Hoạt động', value: active, color: '#10b981' },   // emerald-500
                { name: 'Chưa kích hoạt', value: inactive, color: '#f59e0b' }, // amber-500
                { name: 'Bị khóa', value: banned, color: '#ef4444' }      // red-500
            ]);
        }

        // 3. Xử lý dữ liệu cho Biểu đồ Cột (Tỷ lệ nội dung)
        setContentChartData([
            { name: 'Bài viết', value: Array.isArray(postsData) ? postsData.length : 0, color: '#3b82f6' },    // blue-500
            { name: 'Hội nhóm', value: Array.isArray(groupsData) ? groupsData.length : 0, color: '#6366f1' },  // indigo-500
            { name: 'Thử thách', value: Array.isArray(challengesData) ? challengesData.length : 0, color: '#f59e0b' }, // amber-500
            { name: 'Món ăn', value: Array.isArray(foodsData) ? foodsData.length : 0, color: '#f43f5e' }       // rose-500
        ]);

        // 4. Lấy 4 bài viết mới nhất
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
      <div className="max-w-7xl mx-auto w-full pb-10 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
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
              {/* --- Thẻ Thống kê (Stats Grid) --- */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">group</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">group</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người dùng</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.users}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">article</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">article</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bài viết</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.posts}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">diversity_3</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">diversity_3</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hội nhóm</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.groups}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">stars</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">stars</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thử thách</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.challenges}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-colors">
                  <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-8xl">restaurant</span></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">restaurant</span></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Món ăn</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stats.foods}</p>
                </div>
              </div>

              {/* --- KHU VỰC BIỂU ĐỒ (CHARTS) --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Biểu đồ tròn: Trạng thái User */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">pie_chart</span> Thống kê Trạng thái Người dùng
                      </h2>
                      <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={userChartData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={70}
                                      outerRadius={100}
                                      paddingAngle={5}
                                      dataKey="value"
                                      stroke="none"
                                  >
                                      {userChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Pie>
                                  <RechartsTooltip 
                                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                      itemStyle={{ fontWeight: 'bold' }}
                                  />
                                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Biểu đồ cột: Tỷ lệ nội dung */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">bar_chart</span> Thống kê Nội dung Hệ thống
                      </h2>
                      <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={contentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                  <RechartsTooltip 
                                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                  />
                                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                      {contentChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- HOẠT ĐỘNG GẦN ĐÂY --- */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden h-full">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">dynamic_feed</span> Hoạt động cộng đồng mới nhất
                            </h2>
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
                                            <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded mb-1.5">{post.tag}</span>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{post.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* --- LỐI TẮT QUẢN TRỊ --- */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sticky top-24">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">bolt</span> Lối tắt Quản trị
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