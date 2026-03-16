import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Lấy thông tin user hiện tại
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  type NotificationItem = {
    id: string;
    title: string;
    message: string;
    timeLabel: string;
    unread: boolean;
    href?: string;
    icon?: string;
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const raw = localStorage.getItem('hm_notifications');
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
    return [
      {
        id: 'friend_request_1',
        title: 'Friend request',
        message: 'Bạn có 1 lời mời kết bạn mới.',
        timeLabel: 'Just now',
        unread: true,
        href: '/community-feed',
        icon: 'group_add',
      },
      {
        id: 'workout_schedule_1',
        title: 'Workout reminder',
        message: 'Nhắc lịch: Chest & Triceps vào 07:00 AM.',
        timeLabel: 'Tomorrow',
        unread: true,
        href: '/schedule',
        icon: 'calendar_month',
      },
      {
        id: 'ai_suggestion_1',
        title: 'AI suggestion',
        message: 'AI gợi ý 1 bài tập mới phù hợp với mục tiêu của bạn.',
        timeLabel: 'Today',
        unread: false,
        href: '/workout-user',
        icon: 'auto_awesome',
      },
    ];
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  useEffect(() => {
    try {
      localStorage.setItem('hm_notifications', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (target && menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('hm_notifications');
    navigate('/login'); // Đăng xuất xong đá về trang đăng nhập
  };

  const displayName = user?.profile?.full_name || 'User';
  const avatarUrl =
    user?.profile?.picture || 'https://www.svgrepo.com/show/5125/avatar.svg';

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const openNotification = (n: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)),
    );
    setIsMenuOpen(false);
    if (n.href) navigate(n.href);
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
          {user?.role === 'admin' && (
            <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/dashboard">Dashboard</Link>
          )}
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/workouts">Workouts</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/meal-planner">Meal Plan</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/aicoach">AI Coach</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/community-feed">Community</Link>
          {user?.role === 'admin' && (
            <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/dashboard/meal-planner">
              Thực đơn
            </Link>
          )}
        </nav>
        
        {/* Actions & Profile (Thay đổi theo trạng thái Login) */}
        {token ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              className="relative flex items-center gap-3 rounded-full pr-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary hover:opacity-90 transition-opacity cursor-pointer"
                data-alt="User profile"
                style={{ backgroundImage: `url(${avatarUrl})` }}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                      Hi, {displayName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                    role="menuitem"
                  >
                    View profile
                  </button>
                </div>

                {/* Notifications */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">notifications</span>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Notifications
                      </p>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary"
                      role="menuitem"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {notifications.slice(0, 4).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => openNotification(n)}
                        className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                          n.unread
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        role="menuitem"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 size-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">
                              {n.icon || 'info'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {n.title}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400">{n.timeLabel}</p>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                          {n.unread && (
                            <span className="mt-1 size-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/community-feed');
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                      role="menuitem"
                    >
                      View community
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      role="menuitem"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    role="menuitem"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-10 px-4 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600 transition-colors"
                    role="menuitem"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
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