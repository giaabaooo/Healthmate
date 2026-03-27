import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// Kết nối Socket để nhận thông báo realtime
const socket = io("http://localhost:8000");

const Navbar = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const commMenuRef = useRef<HTMLDivElement | null>(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommMenuOpen, setIsCommMenuOpen] = useState(false);
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

  const token = localStorage.getItem('token');
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

  const [reminders, setReminders] = useState<NotificationItem[]>([]);
  const [commNotis, setCommNotis] = useState<NotificationItem[]>([]);

  // 1. TẢI VÀ QUẢN LÝ WORKOUT REMINDERS
  const loadReminders = () => {
    try {
      const raw = localStorage.getItem('hm_notifications');
      if (raw) {
          let parsed = JSON.parse(raw);
          // Chỉ giữ lại những thông báo nhắc lịch tập hoặc hệ thống
          parsed = parsed.filter((n: NotificationItem) => {
              const t = n.title || '';
              return t.includes('Workout Reminder') || n.id === 'pro_expired';
          });
          setReminders(parsed);
          localStorage.setItem('hm_notifications', JSON.stringify(parsed)); 
      } else {
          setReminders([]); 
      }
    } catch {
      setReminders([]);
    }
  };

  // 2. TẢI VÀ QUẢN LÝ COMMUNITY NOTIFICATIONS
  const loadCommNotis = () => {
      try {
          const raw = localStorage.getItem('hm_comm_notis');
          if (raw) setCommNotis(JSON.parse(raw));
      } catch { setCommNotis([]); }
  };

  useEffect(() => {
    loadReminders(); 
    loadCommNotis();
    window.addEventListener('notifications-updated', loadReminders);
    
    const interval = setInterval(() => {
        setReminders(prev => [...prev]);
        setCommNotis(prev => [...prev]);
    }, 60000); // Tự động làm mới timeLabel mỗi phút
    
    return () => {
        window.removeEventListener('notifications-updated', loadReminders);
        clearInterval(interval);
    }
  }, []);

  // 3. LẮNG NGHE SOCKET REAL-TIME CHO TƯƠNG TÁC CỘNG ĐỒNG
  useEffect(() => {
    if (!user?._id) return;
    
    const handlePostUpdated = (post: any) => {
        // Nếu bài viết này là của mình (User đăng bài)
        const isMyPost = post.user?._id === user._id || post.user === user._id;
        if (!isMyPost) return;

        // Phân tích xem đó là Like mới hay Comment mới
        let isNewComment = false;
        const lastComment = post.comments?.[post.comments?.length - 1];
        
        // Nếu có comment trong vòng 10 giây qua và người comment không phải là chính mình
        if (lastComment && new Date(lastComment.createdAt).getTime() > Date.now() - 10000) {
            if (lastComment.user?._id !== user._id) {
                isNewComment = true;
            } else {
                return; // Tự mình comment thì không báo
            }
        }

        const newNoti: NotificationItem = {
            id: `comm_${Date.now()}`,
            title: isNewComment ? 'Bình luận mới' : 'Lượt thích mới',
            message: isNewComment 
                ? `${lastComment.user?.profile?.full_name || 'Ai đó'} đã bình luận: "${lastComment.text}"` 
                : `Ai đó vừa thả tim bài viết của bạn trên bảng tin.`,
            timeLabel: 'Vừa xong',
            unread: true,
            href: '/community-feed',
            icon: isNewComment ? 'chat_bubble' : 'favorite',
            color: isNewComment ? 'bg-blue-100 text-blue-500' : 'bg-rose-100 text-rose-500'
        };

        setCommNotis(prev => {
            // Chống spam (Tránh lưu 2 thông báo y hệt nhau trong vòng 5 giây)
            const isDuplicate = prev.some(n => n.message === newNoti.message && Date.now() - parseInt(n.id.split('_')[1] || '0') < 5000);
            if (isDuplicate) return prev;
            
            const updated = [newNoti, ...prev].slice(0, 50); // Giữ tối đa 50 thông báo
            localStorage.setItem('hm_comm_notis', JSON.stringify(updated));
            return updated;
        });
    };

    socket.on('post_updated', handlePostUpdated);
    return () => { socket.off('post_updated', handlePostUpdated); };
  }, [user]);

  // Cảnh báo hết hạn Pro
  useEffect(() => {
    if (isExpired) {
        setReminders(prev => {
            if (prev.some(n => n.id === 'pro_expired')) return prev;
            const newNotis = [{
                id: 'pro_expired', title: 'Gói Pro đã hết hạn', 
                message: 'Gói Pro của bạn đã kết thúc. Hãy gia hạn để tiếp tục dùng AI.',
                timeLabel: 'Hôm nay', unread: true, href: '/subscription', 
                icon: 'warning', color: 'text-red-500 bg-red-100'
            }, ...prev];
            localStorage.setItem('hm_notifications', JSON.stringify(newNotis));
            return newNotis;
        });
    }
  }, [isExpired]);

  const unreadReminderCount = useMemo(() => reminders.filter((n) => n.unread).length, [reminders]);
  const unreadCommCount = useMemo(() => commNotis.filter((n) => n.unread).length, [commNotis]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (menuRef.current && !menuRef.current.contains(target)) setIsMenuOpen(false);
      if (commMenuRef.current && !commMenuRef.current.contains(target)) setIsCommMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login'); 
  };

  const handleNotificationClick = (n: NotificationItem, type: 'reminder' | 'comm') => {
      if (type === 'reminder') {
          const updated = reminders.map(noti => noti.id === n.id ? { ...noti, unread: false } : noti);
          setReminders(updated);
          localStorage.setItem('hm_notifications', JSON.stringify(updated));
          setIsMenuOpen(false);
      } else {
          const updated = commNotis.map(noti => noti.id === n.id ? { ...noti, unread: false } : noti);
          setCommNotis(updated);
          localStorage.setItem('hm_comm_notis', JSON.stringify(updated));
          setIsCommMenuOpen(false);
      }

      if (n.id.startsWith('reminder') || n.title.includes('Reminder')) {
          navigate('/schedule');
      } else if (n.href) {
          navigate(n.href);
      }
  };

  const clearAllNotifications = (type: 'reminder' | 'comm') => {
      if (type === 'reminder') {
          const cleared = reminders.filter(n => n.id === 'pro_expired'); 
          setReminders(cleared);
          localStorage.setItem('hm_notifications', JSON.stringify(cleared));
      } else {
          setCommNotis([]);
          localStorage.setItem('hm_comm_notis', JSON.stringify([]));
      }
  };

  const formatTimeAgo = (id: string, fallback: string) => {
      try {
          if (id.includes('_')) {
              const timestamp = parseInt(id.split('_')[1]);
              if (!isNaN(timestamp)) {
                  const diff = Date.now() - timestamp;
                  const minutes = Math.floor(diff / 60000);
                  if (minutes < 1) return 'Vừa xong';
                  if (minutes < 60) return `${minutes} phút trước`;
                  const hours = Math.floor(minutes / 60);
                  if (hours < 24) return `${hours} giờ trước`;
                  return `${Math.floor(hours / 24)} ngày trước`;
              }
          }
      } catch (e) {}
      return fallback || 'Gần đây';
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

      <div className="flex flex-1 justify-end gap-6 items-center">
        <nav className="flex items-center gap-8">
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/workouts">Workouts</Link>
          
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/meal-planner">Meal Plan</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium" to="/community-feed">Community</Link>
          <Link className="text-slate-600 hover:text-primary text-sm font-medium flex items-center gap-1" to="/aicoach">
              AI Coach {isActivePro && <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>}
          </Link>
        </nav>
        
        {token ? (
          <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6">
            
            {/* NÚT CHUÔNG CHO COMMUNITY NOTIFICATIONS */}
            <div className="relative" ref={commMenuRef}>
                <button
                    onClick={() => { setIsCommMenuOpen(!isCommMenuOpen); setIsMenuOpen(false); }}
                    className="relative flex items-center justify-center size-10 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-300">notifications</span>
                    {unreadCommCount > 0 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-50 dark:border-slate-800 rounded-full"></span>
                    )}
                </button>

                {isCommMenuOpen && (
                    <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">public</span> 
                                Tương tác cộng đồng
                            </p>
                            {commNotis.length > 0 && (
                                <button onClick={() => clearAllNotifications('comm')} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                                    Xóa tất cả
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col gap-1 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-900/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full flex-1">
                            {commNotis.length === 0 ? (
                                <div className="text-center text-xs text-slate-400 py-8 italic">Chưa có tương tác mới.</div>
                            ) : (
                                commNotis.map((n) => (
                                <button key={n.id} onClick={() => handleNotificationClick(n, 'comm')} className={`w-full text-left shrink-0 rounded-xl p-3 transition-all ${n.unread ? 'bg-white dark:bg-slate-800 shadow-sm border border-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 size-8 shrink-0 rounded-full flex items-center justify-center ${n.color}`}>
                                            <span className="material-symbols-outlined text-[14px]">{n.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center gap-2">
                                                <p className={`text-xs font-bold truncate ${n.unread ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                                                <span className="text-[9px] font-bold text-slate-400 shrink-0">{formatTimeAgo(n.id, n.timeLabel)}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                        </div>
                                    </div>
                                </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* AVATAR & DROPDOWN CHO WORKOUT REMINDERS */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => { setIsMenuOpen(!isMenuOpen); setIsCommMenuOpen(false); }}
                className="relative flex items-center gap-3 rounded-full pr-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div
                  className={`bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 ${isActivePro ? 'border-amber-400' : 'border-primary'}`}
                  style={{ backgroundImage: `url(${avatarUrl})` }}
                />
                {unreadReminderCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {unreadReminderCount}
                  </span>
                )}
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">Hi, {displayName}</p>
                      {isActivePro && (
                          <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">
                                  <span className="material-symbols-outlined text-[12px]">workspace_premium</span> Pro Member
                              </span>
                          </div>
                      )}
                    </div>
                  </div>

                  <div className="p-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <Link to="/overview" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                      <span className="material-symbols-outlined text-[18px]">dashboard</span> Overview
                    </Link>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                      <span className="material-symbols-outlined text-[18px]">person</span> View Profile
                    </Link>
                    <Link to="/fitness-goals" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                      <span className="material-symbols-outlined text-[18px]">flag</span> Goals
                    </Link>
                    <Link to="/schedule" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200">
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span> Schedule
                    </Link>
                  </div>

                  {/* KHU VỰC WORKOUT REMINDERS */}
                  <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">alarm</span>
                          Workout Reminders
                      </p>
                      {reminders.length > 0 && (
                          <button onClick={() => clearAllNotifications('reminder')} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              Xóa tất cả
                          </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full flex-1">
                      {reminders.length === 0 ? (
                          <div className="text-center text-xs text-slate-400 py-6 italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">Không có nhắc nhở lịch tập.</div>
                      ) : (
                          reminders.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n, 'reminder')}
                              className={`w-full text-left shrink-0 rounded-xl border px-3 py-3 transition-colors bg-white dark:bg-slate-900 ${
                                n.unread
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 size-9 shrink-0 rounded-lg flex items-center justify-center ${n.color || 'bg-slate-100 dark:bg-slate-800 text-primary'}`}>
                                  <span className="material-symbols-outlined text-[18px]">{n.icon || 'alarm'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                      <p className={`text-sm font-bold truncate ${n.unread ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {n.title}
                                      </p>
                                      <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5">
                                          {formatTimeAgo(n.id, n.timeLabel)}
                                      </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                    {n.message}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); navigate('/subscription'); }}
                      className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Upgrade to Pro
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="h-10 px-4 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

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