import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ĐÃ THÊM WORKOUTS VÀO MENU
  const adminMenus = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Tổng quan' },
    { path: '/admin/users', icon: 'manage_accounts', label: 'Quản lý Người dùng' },
    { path: '/admin/posts', icon: 'dynamic_feed', label: 'Quản lý Bài viết' },
    { path: '/admin/groups', icon: 'diversity_3', label: 'Quản lý Hội nhóm' },
    { path: '/admin/challenges', icon: 'emoji_events', label: 'Quản lý Thử thách' },
    { path: '/admin/workouts', icon: 'fitness_center', label: 'Quản lý Workouts' }, // <-- MỚI THÊM
    { path: '/admin/foods', icon: 'restaurant_menu', label: 'Quản lý Món ăn' },
  ];

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-white">
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors">
        <div className="h-20 flex items-center px-8 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-slate-900">
              <span className="material-symbols-outlined font-black">health_and_safety</span>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Health<span className="text-primary">Admin</span></span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {adminMenus.map((menu) => {
            const isActive = location.pathname.includes(menu.path);
            return (
              <Link
                key={menu.path}
                to={menu.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-slate-900 shadow-md shadow-primary/20'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{menu.icon}</span>
                {menu.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-6 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={user?.profile?.picture || 'https://www.svgrepo.com/show/5125/avatar.svg'} 
                alt="Admin" 
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
              />
              <div className="min-w-0">
                <p className="text-xs font-black truncate">{user?.profile?.full_name || 'Administrator'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">System Admin</p>
              </div>
            </div>
            <button onClick={handleLogout} title="Đăng xuất" className="text-red-500 hover:text-red-700 transition-colors shrink-0">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0f172a] relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <div className="p-8 relative z-10">
            {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;