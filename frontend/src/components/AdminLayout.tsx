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

  // Cấu hình các menu chức năng của Admin
  const adminMenus = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Tổng quan' },
    { path: '/admin/users', icon: 'manage_accounts', label: 'Quản lý Người dùng' },
    { path: '/admin/posts', icon: 'dynamic_feed', label: 'Quản lý Bài viết' },
    { path: '/admin/groups', icon: 'diversity_3', label: 'Quản lý Hội nhóm' },
    { path: '/admin/challenges', icon: 'emoji_events', label: 'Quản lý Thử thách' },
    { path: '/admin/foods', icon: 'restaurant_menu', label: 'Quản lý Món ăn' },
  ];

  return (
    // Thiết lập h-screen và overflow-hidden để khóa toàn bộ trang, chỉ cho phép cuộn ở phần main
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 h-full flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
            <div>
              <span className="font-black text-lg tracking-tight block leading-none">HealthMate</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Admin Control</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {adminMenus.map((menu) => {
            const isActive = location.pathname.startsWith(menu.path);
            return (
              <Link
                key={menu.path}
                to={menu.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-slate-900 shadow-md shadow-primary/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{menu.icon}</span>
                {menu.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="px-4 py-6 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {/* User info */}
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
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="text-red-500 hover:text-red-700 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - Thêm overflow-y-auto để nội dung bên phải tự cuộn */}
      <main className="flex-1 h-full min-w-0 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;