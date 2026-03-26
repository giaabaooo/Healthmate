import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const PostManagement = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/community/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      toast.error('Lỗi khi lấy dữ liệu bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: string) => {
    if(window.confirm('Xóa vĩnh viễn bài viết này?')) {
        // Gọi API xóa thực tế ở đây
        setPosts(prev => prev.filter(p => p._id !== id));
        toast.success("Đã xóa bài viết.");
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto w-full pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Quản lý Bài viết</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Kiểm duyệt và quản lý luồng thông tin trên Community Feed.</p>
            </div>
            <button onClick={fetchPosts} className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">refresh</span> Làm mới
            </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-black text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="p-4 w-1/4">Tác giả</th>
                            <th className="p-4 w-1/2">Nội dung</th>
                            <th className="p-4">Tương tác</th>
                            <th className="p-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                        {loading ? (
                            <tr><td colSpan={4} className="p-10 text-center text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</td></tr>
                        ) : posts.length === 0 ? (
                            <tr><td colSpan={4} className="p-10 text-center text-slate-500 font-medium">Chưa có bài viết nào.</td></tr>
                        ) : (
                            posts.map(p => (
                                <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={p.user?.profile?.picture || `https://ui-avatars.com/api/?name=${p.user?.profile?.full_name}&background=random`} alt="avt" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white truncate">{p.user?.profile?.full_name || 'Unknown'}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-block mb-1 px-2 py-0.5 rounded text-[10px] font-bold ${p.isAIPost ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{p.tag || 'Update'}</span>
                                        <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{p.content}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-3 text-slate-500 font-bold text-xs">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">favorite</span> {p.likes?.length || 0}</span>
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat</span> {p.comments?.length || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
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

export default PostManagement;