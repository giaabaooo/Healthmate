import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

// KHAI BÁO API_URL ĐỂ TỰ ĐỘNG SWITCH LOCAL/DEPLOY
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'https://healthmate-y9vt.onrender.com' : 'https://healthmate-y9vt.onrender.com');

interface User {
  id?: string; // Dùng id theo format của adminController
  _id?: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  profile: {
    full_name: string;
    phone_number?: string;
    address?: string;
    picture?: string;
  };
  createdAt: string;
  lastLogin?: string;
  password?: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'banned'>('all');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<User>>({
    email: '', password: '', role: 'user', status: 'active', profile: { full_name: '', phone_number: '', address: '' }
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data);
      }
    } catch (error) { toast.error('Lỗi khi lấy dữ liệu người dùng'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(user => {
    const matchSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || user.role === filterRole;
    const matchStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const handleEdit = (user: User) => {
    setModalMode('edit');
    // Lấy đúng ID do backend trả về là "id"
    const userId = user.id || user._id; 
    setFormData({ ...user, id: userId, password: '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!formData.email || !formData.profile?.full_name) return toast.error("Vui lòng điền đủ Email và Họ tên!");
    if (modalMode === 'create' && (!formData.password || formData.password.length < 6)) return toast.error("Mật khẩu tạo mới phải từ 6 ký tự!");

    const userId = formData.id || formData._id;
    const url = modalMode === 'create' ? `${API_URL}/api/admin/users` : `${API_URL}/api/admin/users/${userId}`;
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            toast.success(`${modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'} người dùng thành công!`);
            setShowModal(false);
            fetchUsers();
        } else {
            const err = await res.json();
            toast.error(err.message || "Có lỗi xảy ra");
        }
    } catch (error) { toast.error("Lỗi kết nối máy chủ"); }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này?')) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Đã xóa tài khoản.");
                setUsers(prev => prev.filter(u => u.id !== id && u._id !== id));
            } else { toast.error("Lỗi khi xóa người dùng."); }
        } catch (error) { toast.error("Lỗi kết nối."); }
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto w-full pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Quản lý Người dùng</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Xem, tìm kiếm và phân quyền các tài khoản trong hệ thống.</p>
            </div>
            <button onClick={() => { setModalMode('create'); setFormData({ email: '', password: '', role: 'user', status: 'active', profile: { full_name: '' } }); setShowModal(true); }} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-slate-900 rounded-xl text-sm font-bold shadow-sm hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-[18px]">person_add</span> Thêm người dùng
            </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px] relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input type="text" placeholder="Tìm theo tên hoặc email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary dark:text-white" />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary dark:text-white">
                <option value="all">Tất cả vai trò</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary dark:text-white">
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động (Active)</option>
                <option value="inactive">Chưa kích hoạt (Inactive)</option>
                <option value="banned">Bị khóa (Banned)</option>
            </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-black text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="p-4">Người dùng</th>
                            <th className="p-4">Vai trò</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                        {loading ? (
                            <tr><td colSpan={4} className="p-10 text-center text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={4} className="p-10 text-center text-slate-500 font-medium">Không tìm thấy người dùng nào.</td></tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.id || u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={u.profile?.picture || `https://ui-avatars.com/api/?name=${u.profile?.full_name}&background=random`} alt="avt" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{u.profile?.full_name || 'No Name'}</p>
                                            <p className="text-xs text-slate-500">{u.email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{u.role}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${u.status === 'active' ? 'bg-green-100 text-green-600' : u.status === 'banned' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{u.status || 'active'}</span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                        <button onClick={() => handleDelete((u.id || u._id) as string)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">{modalMode === 'create' ? 'person_add' : 'edit'}</span>{modalMode === 'create' ? 'Thêm Người dùng' : 'Chỉnh sửa Tài khoản'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                <input type="email" required disabled={modalMode === 'edit'} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm disabled:opacity-50 dark:text-white outline-none focus:border-primary" />
              </div>
              {modalMode === 'create' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mật khẩu</label>
                    <input type="text" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white outline-none focus:border-primary" placeholder="Tối thiểu 6 ký tự"/>
                  </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Họ và tên</label>
                <input type="text" required value={formData.profile?.full_name} onChange={e => setFormData({...formData, profile: {...formData.profile!, full_name: e.target.value}})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vai trò</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white focus:border-primary outline-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng thái</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white focus:border-primary outline-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-6 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-slate-900 bg-primary rounded-xl hover:brightness-110 shadow-sm transition-all">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagement;