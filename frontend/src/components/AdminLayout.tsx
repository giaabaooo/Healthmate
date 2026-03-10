import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Auto-expand Menu nếu đang ở trang /dashboard/foods
  const [menuOpen, setMenuOpen] = useState(
    location.pathname.startsWith('/dashboard/foods')
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const linkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    }`;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <Link to="/homepage" className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">exercise</span>
            <span className="font-bold text-base tracking-tight">HealthMate</span>
          </Link>
          <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {/* Tổng quan */}
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Tổng quan
          </Link>

          {/* Menu accordion */}
          <div>
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Menu
              </div>
              {/* Chevron xoay khi mở */}
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Submenu */}
            {menuOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-slate-200 dark:border-slate-700 space-y-1">
                <Link
                  to="/dashboard/foods"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard/foods'
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Danh sách món ăn
                </Link>
              </div>
            )}
          </div>

          {/* Thực đơn */}
          <Link to="/dashboard/meal-planner" className={linkClass('/dashboard/meal-planner')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Thực đơn
          </Link>
        </nav>

        {/* Divider */}
        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <Link
            to="/aicoach"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Về trang chính
          </Link>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div
              className="w-8 h-8 rounded-full bg-cover bg-center bg-slate-200 flex-shrink-0"
              style={{ backgroundImage: `url(${user?.profile?.picture || 'https://www.svgrepo.com/show/5125/avatar.svg'})` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.profile?.full_name || 'Admin'}</p>
              <button
                onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
