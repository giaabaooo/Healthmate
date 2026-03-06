import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  
  // Lấy thông tin user hiện tại
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login'); // Đăng xuất xong đá về trang đăng nhập
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-10 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link to="/homepage" className="flex items-center gap-4 text-slate-900 dark:text-slate-100">
          <div className="size-6 text-primary">
            <span className="material-symbols-outlined text-3xl">exercise</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">HealthMate</h2>
        </Link>
      </div>

      <div className="flex flex-1 justify-end gap-8 items-center">
        {/* Navigation Links */}
        <nav className="flex items-center gap-9">
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to={user?.role === 'admin' ? '/admin/dashboard' : '/overview'}>
            Dashboard
          </Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/workouts">Workouts</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/meal-planner">Meal Plan</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/aicoach">AI Coach</Link>
          {user?.role === 'admin' && (
            <Link className="text-slate-600 hover:text-primary text-sm font-medium bg-red-100 px-3 py-1 rounded" to="/admin/dashboard">Admin</Link>
          )}
        </nav>
        
        {/* Actions & Profile (Thay đổi theo trạng thái Login) */}
        {token ? (
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium text-slate-600">
               Hi, {user?.profile?.full_name || 'User'}
             </span>
             <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700">
               Đăng xuất
             </button>
             {/* Bọc thẻ Link để click vào Avatar chuyển sang Profile */}
             <Link to="/profile">
               <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary hover:opacity-80 transition-opacity cursor-pointer" 
                  data-alt="User profile" 
                  style={{ backgroundImage: `url(${user?.profile?.picture || "https://www.svgrepo.com/show/5125/avatar.svg"})` }}
                ></div>
             </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
             <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-primary">Đăng nhập</Link>
             <Link to="/register" className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-slate-900 text-sm font-bold hover:opacity-90 transition-opacity">
               Đăng ký
             </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;