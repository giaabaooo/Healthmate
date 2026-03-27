import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const ChallengeManagement = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://healthmate-y9vt.onrender.com/api/community/challenges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
      }
    } catch (error) {
      toast.error('Lỗi khi lấy dữ liệu thử thách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallenges(); }, []);

  const handleDelete = async (id: string) => {
    if(window.confirm('Xóa vĩnh viễn thử thách này khỏi hệ thống?')) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://healthmate-y9vt.onrender.com/api/admin/challenges/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setChallenges(prev => prev.filter(c => c._id !== id));
                toast.success("Đã xóa thử thách thành công.");
            } else {
                toast.error("Lỗi khi xóa thử thách.");
            }
        } catch (error) {
            toast.error("Lỗi kết nối.");
        }
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto w-full pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Quản lý Thử thách</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Quản lý các sự kiện thử thách do người dùng tạo ra.</p>
            </div>
            <button onClick={fetchChallenges} className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">refresh</span> Làm mới
            </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-black text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="p-4">Tên Thử thách</th>
                            <th className="p-4">Mục tiêu</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4">Người tham gia</th>
                            <th className="p-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                        {loading ? (
                            <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</td></tr>
                        ) : challenges.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-medium">Chưa có thử thách nào.</td></tr>
                        ) : (
                            challenges.map(c => (
                                <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-900 dark:text-white mb-0.5">{c.title}</p>
                                        <p className="text-[10px] text-slate-500">Bởi: {c.creator?.profile?.full_name || 'Admin'}</p>
                                    </td>
                                    <td className="p-4 font-black text-primary">
                                        {c.target} <span className="text-xs font-bold text-slate-500">{c.metric}</span>
                                    </td>
                                    <td className="p-4">
                                        {c.isPrivate ? (
                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[12px]">lock</span> Private</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded bg-green-100 text-green-600 text-[10px] font-bold uppercase flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[12px]">public</span> Public</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-slate-400">group</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{c.participants?.length || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(c._id)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ChallengeManagement;