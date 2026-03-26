import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const GroupManagement = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/community/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      toast.error('Lỗi khi lấy dữ liệu hội nhóm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleDelete = async (id: string) => {
    if(window.confirm('Bạn có chắc chắn muốn giải tán nhóm này? Mọi bài viết trong nhóm sẽ bị xóa.')) {
        setGroups(prev => prev.filter(g => g._id !== id));
        toast.success("Đã xóa nhóm thành công.");
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto w-full pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Quản lý Hội nhóm</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Theo dõi và kiểm duyệt các group thể thao của người dùng.</p>
            </div>
            <button onClick={fetchGroups} className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">refresh</span> Làm mới
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
                <div className="col-span-full py-20 text-center text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</div>
            ) : groups.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-500 font-medium">Chưa có nhóm nào được tạo.</div>
            ) : (
                groups.map(g => (
                    <div key={g._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="h-32 bg-slate-200 bg-cover bg-center" style={{backgroundImage: `url(${g.coverImage || 'https://placehold.co/600x400/png?text=Group'})`}}></div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate mb-1">{g.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{g.description || 'Chưa có mô tả'}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full"><span className="material-symbols-outlined text-[12px]">group</span></span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{g.members?.length || 0} Mem</span>
                                </div>
                                <button onClick={() => handleDelete(g._id)} className="text-xs font-bold text-red-500 hover:underline">Giải tán nhóm</button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default GroupManagement;