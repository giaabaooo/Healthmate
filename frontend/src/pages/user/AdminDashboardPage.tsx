import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

const stats = [
  { label: 'Món ăn', value: '—', sub: 'trong thư viện' },
  { label: 'Thực đơn', value: '—', sub: 'đã tạo' },
  { label: 'Người dùng', value: '—', sub: 'đang hoạt động' },
];

const quickLinks = [
  {
    title: 'Thêm món ăn mới',
    desc: 'Thêm món ăn vào thư viện với đầy đủ thông tin dinh dưỡng',
    path: '/dashboard/foods',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
  {
    title: 'Tạo thực đơn',
    desc: 'Lên kế hoạch ăn uống cho bản thân hoặc cho khách hàng',
    path: '/dashboard/meal-planner',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    title: 'Xem danh sách món ăn',
    desc: 'Duyệt, tìm kiếm và chỉnh sửa các món ăn hiện có',
    path: '/dashboard/foods',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
];

const AdminDashboardPage = () => {
  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-1">Tổng quan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Chào mừng trở lại, quản trị viên.</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Thao tác nhanh</h2>
        <div className="space-y-2">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <svg className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
