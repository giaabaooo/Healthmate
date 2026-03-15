import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin-dashboard.css';

// Add Material Icons font
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  profile: {
    full_name: string;
    phone_number?: string;
    address?: string;
  };
  createdAt: string;
  lastLogin?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    status: 'active' as 'active' | 'inactive',
    profile: {
      full_name: '',
      phone_number: '',
      address: ''
    }
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        role: filterRole,
        status: filterStatus
      });

      const response = await fetch(`http://localhost:8000/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination(data.pagination || pagination);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data
      setUsers([
        {
          id: '1',
          email: 'admin@healthmate.com',
          role: 'admin',
          status: 'active',
          profile: {
            full_name: 'System Administrator',
            phone_number: '+849012345678',
            address: 'Hanoi, Vietnam'
          },
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: new Date().toISOString()
        },
        {
          id: '2',
          email: 'user@example.com',
          role: 'user',
          status: 'active',
          profile: {
            full_name: 'Regular User',
            phone_number: '+849012345679',
            address: 'Ho Chi Minh City, Vietnam'
          },
          createdAt: '2024-01-15T00:00:00Z',
          lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      email: '',
      password: '',
      role: 'user',
      status: 'active',
      profile: {
        full_name: '',
        phone_number: '',
        address: ''
      }
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
      profile: {
        full_name: user.profile.full_name,
        phone_number: user.profile.phone_number || '',
        address: user.profile.address || ''
      }
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchUsers();
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchUsers();
      } else {
        console.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'create' 
        ? 'http://localhost:8000/api/admin/users'
        : `http://localhost:8000/api/admin/users/${selectedUser?.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const payload = modalMode === 'create' 
        ? formData
        : { ...formData, password: formData.password || undefined };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        fetchUsers();
      } else {
        console.error('Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-green-400' : 'text-red-400';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'text-purple-400' : 'text-blue-400';
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
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-dim hover:bg-[#28392e] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <p className="text-sm font-medium leading-normal">Dashboard</p>
            </button>
            <button
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 border border-primary/10 text-primary"
            >
              <span className="material-symbols-outlined">group</span>
              <p className="text-sm font-medium leading-normal">Users</p>
            </button>
            <button
              onClick={() => navigate('/admin/workouts')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-dim hover:bg-[#28392e] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">fitness_center</span>
              <p className="text-sm font-medium leading-normal">Workouts</p>
            </button>
            <button
              onClick={() => navigate('/admin/logs')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-dim hover:bg-[#28392e] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">description</span>
              <p className="text-sm font-medium leading-normal">System Logs</p>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-dim hover:bg-[#28392e] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">settings</span>
              <p className="text-sm font-medium leading-normal">Settings</p>
            </button>
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
            <p className="text-xs text-text-dim mt-2">Server uptime: 24d 13h</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-[#28392e] bg-background-dark shrink-0">
          <div>
            <h2 className="text-white text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-text-dim text-sm mt-1">Manage system users and permissions</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#28392e] hover:bg-[#344b3c] text-white text-sm font-medium transition-colors border border-transparent hover:border-primary/30"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Dashboard
            </button>
            <button 
              onClick={handleCreateUser}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-background-dark text-sm font-bold transition-colors shadow-[0_0_15px_rgba(19,236,91,0.3)]"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add New User
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {/* Filters */}
            <div className="bg-surface-dark rounded-xl border border-[#28392e] p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Search</label>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterRole('all');
                      setFilterStatus('all');
                    }}
                    className="w-full px-4 py-2 bg-[#28392e] hover:bg-[#344b3c] text-white rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-surface-dark rounded-xl border border-[#28392e] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#112218] border-b border-[#28392e]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-text-dim uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-text-dim uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-text-dim uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-text-dim uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-text-dim uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#28392e]">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-text-dim">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          Loading users...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-text-dim">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-[#28392e] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">{user.profile.full_name}</div>
                              <div className="text-sm text-text-dim">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)} bg-current/10`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)} bg-current/10`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dim">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit User"
                              >
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user.id, user.status)}
                                className={user.status === 'active' ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                                title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                <span className="material-symbols-outlined">{user.status === 'active' ? 'block' : 'check_circle'}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete User"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-[#28392e] flex items-center justify-between">
                  <div className="text-sm text-text-dim">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 bg-[#112218] border border-[#28392e] rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-white">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 bg-[#112218] border border-[#28392e] rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-dark rounded-xl border border-[#28392e] p-6 w-full max-w-md">
            <h3 className="text-white text-lg font-bold mb-4">
              {modalMode === 'create' ? 'Create New User' : 'Edit User'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.profile.full_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, full_name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-primary"
                  />
                </div>
                {modalMode === 'create' && (
                  <div>
                    <label className="text-text-dim text-sm font-medium mb-2 block">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.profile.phone_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, phone_number: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-text-dim text-sm font-medium mb-2 block">Address</label>
                  <input
                    type="text"
                    value={formData.profile.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, address: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-[#112218] border border-[#28392e] rounded-lg text-white placeholder-text-dim focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-[#28392e] hover:bg-[#344b3c] text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-background-dark rounded-lg transition-colors"
                >
                  {modalMode === 'create' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
