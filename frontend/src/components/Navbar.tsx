import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Hàm load user và kiểm tra gói cước theo thời gian thực (Real-time)
  const loadUser = () => {
    const userString = localStorage.getItem('user');
    setUser(userString ? JSON.parse(userString) : null);
  };

  useEffect(() => {
    loadUser(); // Load lần đầu
    window.addEventListener('user-updated', loadUser); // Lắng nghe khi có thanh toán
    return () => window.removeEventListener('user-updated', loadUser);
  }, []);

  const token = localStorage.getItem('token');

  // --- KIỂM TRA TRẠNG THÁI PRO ---
  const isPro = user?.subscription?.plan === 'pro';
  const proEndDate = isPro ? new Date(user.subscription.endDate) : null;
  const isExpired = proEndDate && proEndDate < new Date();
  const isActivePro = isPro && !isExpired;

  type NotificationItem = {
    id: string;
    title: string;
    message: string;
    timeLabel: string;
    unread: boolean;
    href?: string;
    icon?: string;
    color?: string;
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
        timeLabel: '2 hours ago',
        unread: false,
        href: '/workouts',
        icon: 'fitness_center',
      },
    ];
  });

  // Tự động đẩy thông báo nếu hết hạn Pro
  useEffect(() => {
    if (isExpired) {
        setNotifications(prev => {
            if (prev.some(n => n.id === 'pro_expired')) return prev;
            return [{
                id: 'pro_expired', 
                title: 'Gói Pro đã hết hạn', 
                message: 'Gói Pro của bạn đã kết thúc. Hãy gia hạn để tiếp tục sử dụng AI Coach và Fitness Goals.',
                timeLabel: 'Hôm nay', 
                unread: true, 
                href: '/subscription', 
                icon: 'warning', 
                color: 'text-red-500 bg-red-100'
            }, ...prev];
        });
    }
  }, [isExpired]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (target && menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login'); 
  };

  const displayName = user?.profile?.full_name || 'User';
  const avatarUrl = user?.profile?.picture || 'https://www.svgrepo.com/show/5125/avatar.svg';

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-10 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/homepage" className="flex items-center gap-4 text-slate-900 dark:text-slate-100">
          <div className="size-6 text-primary">
            <span className="material-symbols-outlined text-3xl">exercise</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">
            HealthMate
          </h2>
        </Link>
      </div>

      <div className="flex flex-1 justify-end gap-8 items-center">
        <nav className="flex items-center gap-9">
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/workouts">Workouts</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/meal-planner">Meal Plan</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/community-feed">Community</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium flex items-center gap-1" to="/aicoach">
              AI Coach {isActivePro && <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>}
          </Link>
        </nav>
        
        {token ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="relative flex items-center gap-3 rounded-full pr-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div
                className={`bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 ${isActivePro ? 'border-amber-400' : 'border-primary'}`}
                style={{ backgroundImage: `url(${avatarUrl})` }}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">Hi, {displayName}</p>
                    {/* HUY HIỆU PRO MEMBER */}
                    {isActivePro && (
                        <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">
                                <span className="material-symbols-outlined text-[12px]">workspace_premium</span> Pro Member
                            </span>
                        </div>
                    )}
                  </div>
                </div>

                {/* MENU LINKS (Overview, Profile, Goals) */}
                <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                  <Link to="/overview" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                    <span className="material-symbols-outlined text-[18px]">dashboard</span> Overview
                  </Link>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                    <span className="material-symbols-outlined text-[18px]">person</span> View Profile
                  </Link>
                  <Link to="/fitness-goals" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                    <span className="material-symbols-outlined text-[18px]">flag</span> Goals {isActivePro && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 rounded ml-auto">PRO</span>}
                  </Link>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Notifications</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {notifications.slice(0, 3).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (n.href) navigate(n.href);
                        }}
                        className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                          n.unread
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 size-9 rounded-lg flex items-center justify-center ${n.color || 'bg-slate-100 dark:bg-slate-800'}`}>
                            <span className="material-symbols-outlined">{n.icon || 'info'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/subscription');
                    }}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    role="menuitem"
                  >
                    Upgrade to Pro
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