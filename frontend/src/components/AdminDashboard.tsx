import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin-dashboard.css';

// Add Material Icons font
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  monthlyGrowth: number;
  systemHealth: 'good' | 'warning' | 'critical';
  recentActivity: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
    type: 'login' | 'workout' | 'profile' | 'system' | 'registration';
  }>;
  uptime: string;
}

interface ChartData {
  userGrowth: Array<{ _id: string; count: number }>;
  period: string;
}

// Simple chart component with line overlay
const SimpleBarChart: React.FC<{ data: Array<{ _id: string; count: number }>, period: string }> = ({ data, period }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  const formatLabel = (label: string) => {
    switch (period) {
      case 'month':
        return new Date(label + '-01').toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
      case 'day':
        return new Date(label).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
      case 'week':
        return `Tuần ${label.split('-')[1]}`;
      default:
        return label;
    }
  };

  const getBarColor = (count: number) => {
    if (count === 0) return 'bg-gray-600';
    if (count === maxCount) return 'bg-green-500';
    return 'bg-primary';
  };

  // Create smooth curve points using quadratic bezier curves
  const smoothPoints = [];
  for (let i = 0; i < data.length; i++) {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (maxCount > 0 ? Math.max((data[i].count / maxCount) * 100, 2) : 2);
    
    if (i === 0) {
      smoothPoints.push(`M ${x} ${y}`);
    } else {
      const prevX = ((i - 1) / (data.length - 1)) * 100;
      const prevY = 100 - (maxCount > 0 ? Math.max((data[i - 1].count / maxCount) * 100, 2) : 2);
      const cpX = (prevX + x) / 2;
      smoothPoints.push(`Q ${cpX} ${prevY} ${x} ${y}`);
    }
  }
  const smoothPath = smoothPoints.join(' ');

  // Create area fill points (add bottom corners to close the shape)
  const areaPoints = `${smoothPath} L 100,100 L 0,100 Z`;

  return (
    <div className="h-full flex flex-col relative">
      {/* SVG Line Chart Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="lineStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Area fill under the line */}
        <path
          d={areaPoints}
          fill="url(#lineGradient)"
        />
        
        {/* Main line with glow effect */}
        <path
          d={smoothPath}
          fill="none"
          stroke="url(#lineStrokeGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        
        {/* Add dots at data points with animation */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (maxCount > 0 ? Math.max((item.count / maxCount) * 100, 2) : 2);
          const hasData = item.count > 0;
          
          return (
            <g key={`dot-group-${index}`}>
              {/* Outer glow circle */}
              {hasData && (
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="6"
                  fill="#10b981"
                  opacity="0.2"
                  className="animate-pulse"
                />
              )}
              {/* Main dot */}
              <circle
                cx={`${x}%`}
                cy={`${y}%`}
                r={hasData ? "4" : "2"}
                fill={hasData ? "#10b981" : "#6b7280"}
                stroke="#1f2937"
                strokeWidth="1"
                className={hasData ? "drop-shadow-lg" : ""}
              />
              {/* Value label for significant points */}
              {hasData && item.count === maxCount && (
                <text
                  x={`${x}%`}
                  y={`${y - 8}%`}
                  fill="#10b981"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="drop-shadow-md"
                >
                  {item.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex-1 flex items-end justify-between gap-1 min-h-[120px] relative" style={{ zIndex: 5 }}>
        {data.map((item) => {
          const height = maxCount > 0 ? Math.max((item.count / maxCount) * 100, 2) : 2;
          return (
            <div key={item._id} className="flex-1 flex flex-col items-center group">
              <div 
                className={`w-full ${getBarColor(item.count)} rounded-t transition-all duration-300 hover:opacity-80 relative`}
                style={{ height: `${height}%` }}
                title={`${formatLabel(item._id)}: ${item.count} users`}
              >
                {item.count > 0 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.count}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between gap-1 mt-2">
        {data.map((item, index) => {
          const showLabel = index === 0 || index === Math.floor(data.length / 2) || index === data.length - 1;
          return (
            <div key={item._id} className="flex-1 text-center">
              {showLabel && (
                <p className="text-xs text-text-dim whitespace-nowrap">
                  {formatLabel(item._id)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Statistics */}
      <div className="mt-3 pt-2 border-t border-[#28392e] flex justify-between text-xs">
        <span className="text-text-dim">
          Tổng: {data.reduce((sum, d) => sum + d.count, 0)} users
        </span>
        <span className="text-text-dim">
          Đỉnh: {maxCount} users
        </span>
        <span className="text-text-dim">
          TB: {Math.round(data.reduce((sum, d) => sum + d.count, 0) / data.length)} users/{period === 'month' ? 'tháng' : period === 'day' ? 'ngày' : 'tuần'}
        </span>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSessions: 0,
    monthlyGrowth: 0,
    systemHealth: 'good',
    uptime: '0d 0h',
    recentActivity: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [chartData, setChartData] = useState<ChartData>({
    userGrowth: [],
    period: 'month'
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchChartData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/admin/chart-data?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        console.error('Failed to fetch chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  }, [navigate, selectedPeriod]);

  useEffect(() => {
    fetchDashboardData();
    fetchChartData();
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchChartData();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod, fetchDashboardData, fetchChartData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDataBackup = () => {
    // Implement data backup functionality
    console.log('Starting data backup...');
  };

  const handleSystemRecovery = () => {
    // Implement system recovery functionality
    console.log('Starting system recovery...');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { id: 'users', label: 'Users', icon: 'group', route: '/admin/users' },
    { id: 'workouts', label: 'Workouts', icon: 'fitness_center', route: '/admin/workouts' },
    { id: 'logs', label: 'System Logs', icon: 'description', route: '/admin/logs' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/admin/settings' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return 'login';
      case 'workout': return 'fitness_center';
      case 'profile': return 'person';
      case 'system': return 'settings';
      default: return 'info';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'text-blue-400';
      case 'workout': return 'text-green-400';
      case 'profile': return 'text-purple-400';
      case 'system': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="admin-dashboard dark flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-text-light font-display antialiased selection:bg-primary selection:text-background-dark">
      {/* Sidebar Navigation */}
      <aside className="flex w-64 flex-col justify-between border-r border-[#28392e] bg-surface-darker p-4 flex-shrink-0 z-20 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-center mb-4">
            <div className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border-2 border-primary/20" 
                 style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDi_ORhEtYDtre8G6YrAKTVxAV6-jnyFq6dRJxWxU8jfJRohQlcHzuS7gxoSzox9O2zJOZYV9J7gP3pjjAj3dXYZy7nZULA6ugWSNwdVCRCi80g0t_PLt0zu8TW08ADGQhcuSFJgAtl1j9CRfZabbO0bm50sVSBML8cagvhtInZU3Km_rIL5AswM-pMt1Ial3BqjEbqHPI2TAw6Fc9vy52WoZSbjML6wyLQiMRA_vhszcd-m-hCBXUVONsUNCJGz1o0nSlXJPmWCes")' }}>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-bold leading-normal">HealthMate Admin</h1>
              <p className="text-text-dim text-xs font-normal leading-normal">System Manager</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-text-dim hover:bg-[#28392e] hover:text-white`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <p className="text-sm font-medium leading-normal">{item.label}</p>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto pt-6 border-t border-[#28392e]">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/10">
            <p className="text-xs text-text-dim font-medium uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm text-white font-semibold">All Systems Go</span>
            </div>
            <p className="text-xs text-text-dim mt-2">Server uptime: {stats.uptime}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-[#28392e] bg-background-dark shrink-0">
          <div>
            <h2 className="text-white text-3xl font-bold tracking-tight">System Overview</h2>
            <p className="text-text-dim text-sm mt-1">Real-time analytics and system health monitoring.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleDataBackup}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#28392e] hover:bg-[#344b3c] text-white text-sm font-medium transition-colors border border-transparent hover:border-primary/30"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_download</span>
              Data Backup
            </button>
            <button 
              onClick={handleSystemRecovery}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-background-dark text-sm font-bold transition-colors shadow-[0_0_15px_rgba(19,236,91,0.3)]"
            >
              <span className="material-symbols-outlined text-[18px]">build_circle</span>
              System Recovery
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors border border-transparent hover:border-red-400"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className="flex flex-col justify-between p-5 rounded-xl bg-surface-dark border border-[#28392e] hover:border-primary/30 transition-all group">
                <div className="flex justify-between items-start">
                  <p className="text-text-dim text-sm font-medium">Total Users</p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">group_add</span>
                </div>
                <div className="mt-4">
                  <p className="text-white text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                    <p className="text-primary text-sm font-medium">+{stats.monthlyGrowth}%</p>
                    <p className="text-text-dim text-xs ml-1">from last month</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between p-5 rounded-xl bg-surface-dark border border-[#28392e] hover:border-primary/30 transition-all group">
                <div className="flex justify-between items-start">
                  <p className="text-text-dim text-sm font-medium">Active Sessions</p>
                  <span className="material-symbols-outlined text-blue-400 bg-blue-400/10 p-1.5 rounded-lg">devices</span>
                </div>
                <div className="mt-4">
                  <p className="text-white text-3xl font-bold">{stats.activeSessions.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                    <p className="text-primary text-sm font-medium">+5%</p>
                    <p className="text-text-dim text-xs ml-1">current load</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Line Chart */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-surface-dark border border-[#28392e]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white text-lg font-bold">New Users by Month</h3>
                    <p className="text-text-dim text-sm">Growth trajectory over last 6 months</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#112218] rounded-lg p-1 border border-[#28392e]">
                    <button 
                      onClick={() => setSelectedPeriod('month')}
                      className={`px-3 py-1 rounded text-xs font-medium ${selectedPeriod === 'month' ? 'bg-[#28392e] text-white' : 'text-text-dim hover:text-white'}`}
                    >
                      Month
                    </button>
                    <button 
                      onClick={() => setSelectedPeriod('week')}
                      className={`px-3 py-1 rounded text-xs font-medium ${selectedPeriod === 'week' ? 'bg-[#28392e] text-white' : 'text-text-dim hover:text-white'}`}
                    >
                      Week
                    </button>
                    <button 
                      onClick={() => setSelectedPeriod('day')}
                      className={`px-3 py-1 rounded text-xs font-medium ${selectedPeriod === 'day' ? 'bg-[#28392e] text-white' : 'text-text-dim hover:text-white'}`}
                    >
                      Day
                    </button>
                  </div>
                </div>
                <div className="h-64 bg-[#112218] rounded-lg p-4">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : chartData.userGrowth.length > 0 ? (
                    <SimpleBarChart data={chartData.userGrowth} period={chartData.period} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <span className="material-symbols-outlined text-4xl text-primary mb-2">bar_chart</span>
                        <p className="text-text-dim">No data available</p>
                        <p className="text-xs text-text-dim mt-1">Try a different time period</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="p-6 rounded-xl bg-surface-dark border border-[#28392e]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white text-lg font-bold">Recent Activity</h3>
                    <p className="text-text-dim text-sm">Latest system events</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#28392e] transition-colors">
                      <span className={`material-symbols-outlined ${getActivityColor(activity.type)} bg-current/10 p-1.5 rounded-lg`}>
                        {getActivityIcon(activity.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{activity.user}</p>
                        <p className="text-text-dim text-xs">{activity.action}</p>
                        <p className="text-text-dim text-xs mt-1">
                          {new Date(activity.timestamp).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-xl bg-surface-dark border border-[#28392e]">
              <h3 className="text-white text-lg font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#28392e] hover:bg-[#344b3c] transition-colors border border-transparent hover:border-primary/30">
                  <span className="material-symbols-outlined text-primary mb-2">person_add</span>
                  <span className="text-white text-xs font-medium">Add User</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#28392e] hover:bg-[#344b3c] transition-colors border border-transparent hover:border-primary/30">
                  <span className="material-symbols-outlined text-blue-400 mb-2">assessment</span>
                  <span className="text-white text-xs font-medium">Reports</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#28392e] hover:bg-[#344b3c] transition-colors border border-transparent hover:border-primary/30">
                  <span className="material-symbols-outlined text-yellow-400 mb-2">settings</span>
                  <span className="text-white text-xs font-medium">Settings</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#28392e] hover:bg-[#344b3c] transition-colors border border-transparent hover:border-primary/30"
                >
                  <span className="material-symbols-outlined text-red-400 mb-2">logout</span>
                  <span className="text-white text-xs font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
