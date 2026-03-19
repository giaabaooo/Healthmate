import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:8000");

const getAvatar = (name: string, picture?: string) => {
    if (picture && picture.trim() !== '') return picture;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
};

const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const CommunityFeed = () => {
    const [activeView, setActiveView] = useState('feed'); // 'feed', 'leaderboard', 'groups', 'group_detail'
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
    const [currentGroupData, setCurrentGroupData] = useState<any>(null);
    
    const [activeTab, setActiveTab] = useState('all');
    const [posts, setPosts] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    
    const [content, setContent] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [locationInfo, setLocationInfo] = useState<string>("");

    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // Lắng nghe sự thay đổi của activeView và currentGroupId để Fetch dữ liệu
    useEffect(() => {
        let url = "http://localhost:8000/api/community/posts";
        
        // Cập nhật URL nếu đang xem Post của 1 Group cụ thể
        if (activeView === 'group_detail' && currentGroupId) {
            url += `?groupId=${currentGroupId}`;
            fetch(`http://localhost:8000/api/community/groups/${currentGroupId}`)
                .then(res => res.json())
                .then(data => setCurrentGroupData(data));
        } else {
            setCurrentGroupData(null);
        }

        // Fetch danh sách bài viết
        fetch(url)
            .then(res => res.json())
            .then(data => setPosts(Array.isArray(data) ? data : []))
            .catch(err => console.error("API Error:", err));

        // Fetch Leaderboard LIÊN TỤC để cột Right Leaderboard Preview luôn có data thật
        fetch("http://localhost:8000/api/community/leaderboard")
            .then(res => res.json())
            .then(data => setLeaderboard(data))
            .catch(err => console.error("API Leaderboard Error:", err));

    }, [activeView, currentGroupId]);

    // Socket.io listeners
    useEffect(() => {
        socket.on('new_post', (newPost) => {
            const isGroupMatch = activeView === 'group_detail' ? newPost.groupId === currentGroupId : !newPost.groupId;
            if (isGroupMatch) {
                setPosts(prev => [newPost, ...prev]);
            }
        });
        socket.on('post_updated', (updatedPost) => {
            setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
        });
        return () => { socket.off('new_post'); socket.off('post_updated'); };
    }, [activeView, currentGroupId]);

    const handlePost = async () => {
        if (!token) return navigate("/login");
        if (!content.trim() && !mediaFile) return;

        const formData = new FormData();
        formData.append("content", content);
        formData.append("tag", activeView === 'group_detail' ? "Group Discussion" : "Update");
        
        if (activeView === 'group_detail' && currentGroupId) {
            formData.append("groupId", currentGroupId);
        }

        if (locationInfo) formData.append("location", locationInfo);
        if (mediaFile) formData.append("media", mediaFile);

        const response = await fetch("http://localhost:8000/api/community/posts", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            const newPost = await response.json();
            setPosts(prev => [newPost, ...prev]);
            setContent(""); setMediaFile(null); setLocationInfo("");
        }
    };

    const handleUpdatePost = (updatedPost: any) => {
        setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    };

    const filteredPosts = posts.filter(post => {
        if (activeTab === 'all') return true;
        if (activeTab === 'ai') return post.isAIPost;
        if (activeTab === 'saved') return post.savedBy?.includes(currentUser._id);
        return true;
    });

    return (
        <div className="flex flex-col min-h-screen bg-[#f6f8f6] dark:bg-[#102216] font-['Inter']">
            <Navbar />
            <main className="flex-grow max-w-[1280px] mx-auto px-6 py-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* CỘT TRÁI */}
                    <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
                        <LeftSidebar activeView={activeView} setActiveView={(view: string) => {
                            setActiveView(view);
                            if(view !== 'group_detail') setCurrentGroupId(null);
                        }} user={currentUser} />
                        <CommunityGroupsPreview setActiveView={setActiveView} setCurrentGroupId={setCurrentGroupId} />
                    </div>

                    {/* CỘT GIỮA */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                        
                        {(activeView === 'feed' || activeView === 'group_detail') && (
                            <>
                                {activeView === 'group_detail' && currentGroupData && (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                                        <div className="h-32 bg-slate-200 bg-cover bg-center" style={{backgroundImage: `url(${currentGroupData.coverImage})`}}></div>
                                        <div className="p-5">
                                            <h2 className="text-xl font-black dark:text-white">{currentGroupData.name}</h2>
                                            <p className="text-sm text-slate-500 mt-1">{currentGroupData.description}</p>
                                            <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">group</span> {currentGroupData.members?.length} Members</span>
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">shield_person</span> Admin: {currentGroupData.admin?.profile?.full_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {token && (
                                    <ShareUpdateSection 
                                        content={content} setContent={setContent} 
                                        mediaFile={mediaFile} setMediaFile={setMediaFile}
                                        locationInfo={locationInfo} setLocationInfo={setLocationInfo}
                                        handlePost={handlePost} 
                                        user={currentUser} 
                                    />
                                )}
                                
                                {activeView === 'feed' && (
                                    <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
                                        {[
                                            { id: 'all', label: 'All Posts' },
                                            { id: 'ai', label: 'AI Coach' },
                                            { id: 'saved', label: 'Saved' } 
                                        ].map(tab => (
                                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                                className={`pb-3 text-sm font-bold uppercase tracking-tighter transition-colors ${
                                                    activeTab === tab.id ? 'border-b-2 border-primary text-slate-900 dark:text-white' : 'text-slate-500 hover:text-primary'
                                                }`}>{tab.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {filteredPosts.length > 0 ? (
                                        filteredPosts.map(post => (
                                            <PostCard key={post._id} post={post} currentUserId={currentUser._id} token={token} navigate={navigate} onUpdate={handleUpdatePost} />
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-500 py-10">Chưa có bài viết nào.</p>
                                    )}
                                </div>
                            </>
                        )}
                        
                        {activeView === 'leaderboard' && <LeaderboardView data={leaderboard} />}
                        {activeView === 'groups' && <DiscoverGroups user={currentUser} setActiveView={setActiveView} setCurrentGroupId={setCurrentGroupId} />}
                        {activeView === 'challenges' && <MyChallenges />}
                    </div>

                    {/* CỘT PHẢI */}
                    <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
                        <RightLeaderboardPreview data={leaderboard} setActiveView={setActiveView} />
                        <TrendingTags />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

// ─── COMPONENT: DISCOVER GROUPS ──────────────────────────────────────────

const DiscoverGroups = ({ user, setActiveView, setCurrentGroupId }: any) => {
    const [groups, setGroups] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const token = localStorage.getItem("token");

    const fetchGroups = () => {
        fetch("http://localhost:8000/api/community/groups")
            .then(res => res.json())
            .then(data => setGroups(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchGroups(); }, []);

    const handleCreateGroup = async () => {
        if(!newGroupName.trim() || !token) return;
        const res = await fetch("http://localhost:8000/api/community/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ name: newGroupName, description: newGroupDesc })
        });
        if (res.ok) {
            setShowCreateModal(false);
            setNewGroupName(""); setNewGroupDesc("");
            fetchGroups(); 
        }
    };

    const handleJoinGroup = async (groupId: string) => {
        if(!token) return;
        const res = await fetch(`http://localhost:8000/api/community/groups/${groupId}/join`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if(res.ok) fetchGroups();
    };

    const handleViewGroup = (groupId: string) => {
        setCurrentGroupId(groupId);
        setActiveView('group_detail');
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">groups</span> Khám phá Hội Nhóm
                </h2>
                <button onClick={() => setShowCreateModal(true)} className="bg-primary text-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all">
                    + Tạo Nhóm Mới
                </button>
            </div>

            {showCreateModal && (
                <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-sm mb-3 dark:text-white">Tạo nhóm của bạn</h3>
                    <input type="text" placeholder="Tên nhóm (VD: Hội chạy bộ Hồ Tây)" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full mb-3 px-3 py-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white text-sm" />
                    <textarea placeholder="Mô tả nhóm..." value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="w-full mb-3 px-3 py-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white text-sm" rows={2}></textarea>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Hủy</button>
                        <button onClick={handleCreateGroup} className="bg-primary text-black px-4 py-2 rounded-lg text-sm font-bold">Xác nhận tạo</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map(group => {
                    const isMember = group.members?.includes(user._id);
                    return (
                        <div key={group._id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
                            <div className="h-20 bg-cover bg-center" style={{backgroundImage: `url(${group.coverImage})`}}></div>
                            <div className="p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{group.name}</h3>
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{group.description || 'Chưa có mô tả'}</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{group.members?.length || 0} Thành viên</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleJoinGroup(group._id)} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${isMember ? 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600' : 'bg-primary text-black hover:brightness-110'}`}>
                                            {isMember ? 'Rời nhóm' : 'Tham gia'}
                                        </button>
                                        <button onClick={() => handleViewGroup(group._id)} className="px-3 py-1.5 rounded text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                                            Xem feed
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


// ─── COMPONENT: COMMUNITY GROUPS PREVIEW (Cột Trái - DỮ LIỆU THẬT) ─────────

const CommunityGroupsPreview = ({ setActiveView, setCurrentGroupId }: any) => {
    const [previewGroups, setPreviewGroups] = useState<any[]>([]);

    useEffect(() => {
        fetch("http://localhost:8000/api/community/groups")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPreviewGroups(data.slice(0, 3)); // Lấy top 3 nhóm
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-4 tracking-tight">Community Groups</h3>
            <div className="flex flex-col gap-4">
                {previewGroups.map((group) => (
                    <div key={group._id} className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden shrink-0">
                            {group.coverImage ? (
                                <img src={group.coverImage} className="w-full h-full object-cover" alt="cover" />
                            ) : (
                                <span className="material-symbols-outlined text-[22px]">groups</span>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                            <p className="text-xs font-bold dark:text-white truncate">{group.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{group.members?.length || 0} members</p>
                        </div>
                        <button 
                            onClick={() => {
                                setCurrentGroupId(group._id);
                                setActiveView('group_detail');
                            }} 
                            className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline transition-all"
                        >
                            View
                        </button>
                    </div>
                ))}
                {previewGroups.length === 0 && <p className="text-xs text-slate-500 text-center py-2">Chưa có nhóm nào</p>}
            </div>
            <button onClick={() => setActiveView('groups')} className="w-full mt-5 py-2 text-slate-400 text-xs font-bold border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 transition-colors">See All</button>
        </div>
    );
};


// ─── CÁC COMPONENT CÒN LẠI (Sửa RightLeaderboardPreview) ──────────────────

const LeftSidebar = ({ activeView, setActiveView, user }: any) => { 
    const avatar = getAvatar(user.profile?.full_name, user.profile?.picture);
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 sticky top-24">
            <div className="flex items-center gap-4 mb-6">
                <img src={avatar} className="size-12 rounded-full object-cover border-2 border-primary p-0.5" alt="Profile" />
                <div className="flex flex-col">
                    <h1 className="text-slate-900 dark:text-white text-base font-bold truncate max-w-[150px]">{user.profile?.full_name || "Guest"}</h1>
                    <p className="text-primary text-[10px] font-black uppercase tracking-wider">Pro Member</p>
                </div>
            </div>
            <nav className="flex flex-col gap-1">
                {[
                    { id: 'feed', icon: 'dynamic_feed', label: 'Feed' },
                    { id: 'leaderboard', icon: 'leaderboard', label: 'Leaderboards' },
                    { id: 'groups', icon: 'groups', label: 'Discover Groups' },
                    { id: 'challenges', icon: 'stars', label: 'My Challenges' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setActiveView(item.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeView === item.id ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        <p className="text-sm font-semibold">{item.label}</p>
                    </button>
                ))}
            </nav>
        </div>
    );
};

const ShareUpdateSection = ({ content, setContent, mediaFile, setMediaFile, locationInfo, setLocationInfo, handlePost, user }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [locationSearch, setLocationSearch] = useState("");
    const [locationResults, setLocationResults] = useState<any[]>([]);
    const [isSearchingLoc, setIsSearchingLoc] = useState(false);

    const searchLocation = async (query: string) => {
        setLocationSearch(query);
        if (query.length < 3) {
            setLocationResults([]);
            return;
        }
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=vn&accept-language=vi`);
            const data = await res.json();
            setLocationResults(data);
        } catch (error) { console.error("Location search failed", error); }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex gap-4">
                <img src={getAvatar(user.profile?.full_name, user.profile?.picture)} className="size-10 rounded-full shrink-0 object-cover" alt="Me" />
                <div className="flex-1 flex flex-col relative">
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} 
                        className="w-full min-h-[80px] border-none focus:ring-0 focus:outline-none bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 resize-none" 
                        placeholder="Chia sẻ buổi tập hoặc tiến độ của bạn..." />
                    
                    {(mediaFile || locationInfo) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {mediaFile && <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">attachment</span>{mediaFile.name} <button onClick={()=>setMediaFile(null)} className="ml-1 text-red-500 font-bold hover:scale-110">×</button></span>}
                            {locationInfo && <span className="text-xs bg-primary/10 px-2 py-1 rounded-md text-primary font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span>{locationInfo} <button onClick={()=>{setLocationInfo(""); setIsSearchingLoc(false);}} className="ml-1 text-red-500 font-bold hover:scale-110">×</button></span>}
                        </div>
                    )}

                    {isSearchingLoc && !locationInfo && (
                        <div className="mt-3 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <input type="text" value={locationSearch} onChange={(e) => searchLocation(e.target.value)} placeholder="Nhập tên địa điểm tại Việt Nam..." autoFocus
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm dark:text-white outline-none focus:border-primary" />
                            {locationResults.length > 0 && (
                                <ul className="mt-2 max-h-32 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded shadow-lg">
                                    {locationResults.map((loc, idx) => (
                                        <li key={idx} onClick={() => {
                                            setLocationInfo(loc.display_name.split(',')[0]); 
                                            setIsSearchingLoc(false);
                                            setLocationSearch("");
                                            setLocationResults([]);
                                        }} className="px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800 last:border-0 truncate">
                                            {loc.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-4 text-slate-500 items-center">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined cursor-pointer">image</span>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                                if(e.target.files && e.target.files[0]) setMediaFile(e.target.files[0]);
                            }} />

                            <button 
                                onClick={() => setIsSearchingLoc(!isSearchingLoc)} 
                                disabled={!!locationInfo}
                                className={`flex items-center gap-1 transition-colors ${locationInfo ? 'text-slate-300 cursor-not-allowed' : 'hover:text-primary'}`}
                                title={locationInfo ? "Chỉ được chọn 1 địa điểm" : "Thêm vị trí"}
                            >
                                <span className="material-symbols-outlined">location_on</span>
                            </button>
                        </div>
                        <button onClick={handlePost} className="bg-primary text-slate-900 px-6 py-2 rounded-lg text-sm font-bold shadow-sm shadow-primary/20 active:scale-95 transition-all">Đăng bài</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PostCard = ({ post, currentUserId, token, navigate, onUpdate }: any) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    
    const isLiked = post.likes?.includes(currentUserId);
    const isSaved = post.savedBy?.includes(currentUserId);

    const toggleAction = async (action: 'like' | 'save') => {
        if (!token) return navigate("/login");
        try {
            const response = await fetch(`http://localhost:8000/api/community/posts/${post._id}/${action}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const updatedPost = await response.json();
                onUpdate(updatedPost);
            }
        } catch (error) { console.error(`Lỗi khi ${action}:`, error); }
    };

    const submitComment = async () => {
        if (!token) return navigate("/login");
        if (!commentText.trim()) return;
        try {
            const response = await fetch(`http://localhost:8000/api/community/posts/${post._id}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ text: commentText })
            });
            if (response.ok) {
                const updatedPost = await response.json();
                onUpdate(updatedPost);
                setCommentText("");
            }
        } catch (error) { console.error("Lỗi khi comment:", error); }
    };

    const isVideo = post.mediaType?.includes("video");

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-hover hover:shadow-md relative">
            {post.isAIPost && (
                <div className="absolute top-4 right-4 bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI COACH
                </div>
            )}

            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={getAvatar(post.user?.profile?.full_name, post.user?.profile?.picture)} className="size-10 rounded-full object-cover" alt="User" />
                    <div>
                        <h4 className="text-sm font-bold dark:text-white leading-none">{post.user?.profile?.full_name || "Người dùng"}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                            <span>{formatDateTime(post.createdAt)}</span>
                            {post.location && <><span className="mx-1">•</span> <span className="flex items-center"><span className="material-symbols-outlined text-[12px] mr-0.5">location_on</span> {post.location}</span></>}
                            <span className="mx-1">•</span>
                            <span className="text-primary font-bold">{post.tag}</span>
                        </div>
                    </div>
                </div>
                {!post.isAIPost && <button className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">more_horiz</span></button>}
            </div>
            
            <div className="px-4 pb-3">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
                {post.mediaUrl && (
                    <div className="rounded-xl overflow-hidden mt-2 bg-slate-100 dark:bg-slate-800">
                        {isVideo ? (
                            <video controls className="w-full max-h-[400px] object-contain">
                                <source src={post.mediaUrl} type={post.mediaType} />
                                Trình duyệt không hỗ trợ.
                            </video>
                        ) : (
                            <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[400px] object-contain" />
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex gap-6">
                        <button onClick={() => toggleAction('like')} className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-primary'}`}>
                            <span className="material-symbols-outlined text-[20px]">{isLiked ? 'favorite' : 'favorite_border'}</span>
                            <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                        </button>
                        {!post.isAIPost && (
                            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
                                <span className="text-xs font-medium">{post.comments?.length || 0}</span>
                            </button>
                        )}
                        <button onClick={() => toggleAction('save')} className={`flex items-center gap-1.5 transition-colors ${isSaved ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
                            <span className="material-symbols-outlined text-[20px]">{isSaved ? 'bookmark' : 'bookmark_border'}</span>
                        </button>
                    </div>
                    <button className="text-slate-500 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">share</span></button>
                </div>
            </div>

            {(!post.isAIPost && showComments) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                        {post.comments?.map((c: any, i: number) => (
                            <div key={i} className="flex gap-3 items-start">
                                <img src={getAvatar(c.user?.profile?.full_name, c.user?.profile?.picture)} className="size-8 rounded-full object-cover border border-white" alt="Avatar" />
                                <div className="flex-1">
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 inline-block w-full">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className="text-[12px] font-black dark:text-white leading-none">{c.user?.profile?.full_name || "Người dùng"}</p>
                                            <span className="text-[9px] text-slate-400 ml-2">{formatDateTime(c.createdAt || post.createdAt)}</span>
                                        </div>
                                        <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-tight">{c.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 bg-white dark:bg-slate-900 rounded-full p-1.5 border border-slate-200 dark:border-slate-800 items-center">
                        <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                            disabled={!token}
                            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                            className="flex-1 bg-transparent border-none px-4 py-1 text-sm outline-none focus:ring-0 dark:text-white" placeholder={token ? "Viết bình luận..." : "Đăng nhập để bình luận"} />
                        <button onClick={submitComment} className="bg-primary text-black font-bold text-xs px-5 py-2 rounded-full uppercase tracking-wider hover:brightness-110">Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RightLeaderboardPreview = ({ data, setActiveView }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-slate-900 dark:text-white font-bold text-sm">Leaderboard</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">Global</span>
        </div>
        <div className="p-2 space-y-1">
            {data.slice(0, 3).map((user: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <span className="text-xs font-black text-slate-400 w-4 text-center">{i + 1}</span>
                    <img src={getAvatar(user.name, user.picture)} className="size-8 rounded-full border border-slate-100 object-cover" />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold dark:text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-500">{user.totalExercises} Exs</p>
                    </div>
                    {i === 0 && <span className="material-symbols-outlined text-amber-400 text-[18px]">workspace_premium</span>}
                </div>
            ))}
            {data.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Chưa có dữ liệu xếp hạng</p>}
        </div>
        <button onClick={() => setActiveView('leaderboard')} className="w-full py-3 text-primary text-[11px] font-bold border-t border-slate-50 dark:border-slate-800 hover:bg-slate-50 transition-colors uppercase">Full Ranking</button>
    </div>
);

const LeaderboardView = ({ data }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">emoji_events</span> Ranking
        </h2>
        <div className="space-y-3">
            {data.length > 0 ? data.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                        <span className={`text-lg font-black w-6 ${index < 3 ? 'text-primary' : 'text-slate-300'}`}>{index + 1}</span>
                        <img src={getAvatar(item.name, item.picture)} className="size-10 rounded-full border-2 border-white object-cover" alt="User" />
                        <p className="font-bold text-sm dark:text-white">{item.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-primary font-black leading-none">{item.totalExercises}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Exercises</p>
                    </div>
                </div>
            )) : <p className="text-center text-slate-500 py-10 font-medium">No active users found.</p>}
        </div>
    </div>
);

const TrendingTags = () => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold mb-4 dark:text-white text-[12px] uppercase tracking-widest text-slate-900">Trending Tags</h3>
        <div className="flex flex-wrap gap-2">
            {['#Workout', '#Healthmate', '#Running', '#Yoga', '#Gym'].map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer">{tag}</span>
            ))}
        </div>
    </div>
);

const MyChallenges = () => (
    <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full -mr-10 -mt-10"></div>
        <div className="relative z-10">
            <p className="text-primary font-black text-xs uppercase mb-2 tracking-[0.2em]">Active Challenge</p>
            <h3 className="text-3xl font-black italic mb-6">50KM MARCH RUN</h3>
            <div className="w-full bg-white/10 h-3 rounded-full mb-3">
                <div className="bg-primary h-full w-2/3 rounded-full shadow-[0_0_15px_rgba(18,236,91,0.4)]" />
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                <p>32.5 / 50 KM completed</p>
                <p className="text-primary">65%</p>
            </div>
        </div>
    </div>
);

export default CommunityFeed;