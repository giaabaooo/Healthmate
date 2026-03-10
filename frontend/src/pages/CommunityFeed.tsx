// ─── Types ────────────────────────────────────────────────────────────────────

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

interface GroupItem {
    icon: string;
    iconBg: string;
    iconColor: string;
    name: string;
    members: string;
}

interface LeaderboardItem {
    rank: number;
    avatar: string;
    name: string;
    points: string;
    isTop?: boolean;
}

interface SuggestedFriend {
    avatar: string;
    name: string;
    reason: string;
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

const LeftSidebar = () => {
    const groups: GroupItem[] = [
        { icon: 'self_improvement', iconBg: 'bg-primary/20', iconColor: 'text-primary', name: 'Yoga Lovers', members: '12.4k members' },
        { icon: 'fitness_center', iconBg: 'bg-blue-100', iconColor: 'text-blue-500', name: 'Powerlifters', members: '8.2k members' },
        { icon: 'restaurant', iconBg: 'bg-orange-100', iconColor: 'text-orange-500', name: 'Meal Prep Squad', members: '15k members' },
    ];

    return (
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
            {/* Profile & Nav */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-6">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
                        style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAiwrto0zPn7sxGi_5GTBvHUyxPncgEENH_CggUU4OQhhzbL1t1pfp7lRQ_ExOM0KHX8wKD0sHU2KByo7AWLZKuAToZN_nco4LuUt_TTVgsspuRJMKhF3AjqzP1yxOAAR2n1skKrCTphEnB4U2MBkZvINlBXzSmKrFAHd4iipYw0tfbOhFLVr6ZheGAuTeZ5PEyWWjec0nFC3dO_pXGgYdjgkcpi1whPC2MI99h0pvVYfp2yWKxiKwAcDoKHGC_OVcfmTrs0M1JCnE")` }}
                    />
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-base font-bold">Alex Johnson</h1>
                        <p className="text-primary text-xs font-semibold uppercase tracking-wider">Pro Member</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-1">
                    {[
                        { icon: 'dynamic_feed', label: 'Feed', active: true },
                        { icon: 'leaderboard', label: 'Leaderboards' },
                        { icon: 'groups', label: 'Discover Groups' },
                        { icon: 'stars', label: 'My Challenges' },
                    ].map(({ icon, label, active }) => (
                        <a
                            key={label}
                            href="#"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{icon}</span>
                            <p className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{label}</p>
                        </a>
                    ))}
                </nav>
            </div>

            {/* Community Groups */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-4">Community Groups</h3>
                <div className="flex flex-col gap-4">
                    {groups.map((g) => (
                        <div key={g.name} className="flex items-center gap-3">
                            <div className={`size-10 rounded-lg ${g.iconBg} flex items-center justify-center ${g.iconColor}`}>
                                <span className="material-symbols-outlined">{g.icon}</span>
                            </div>
                            <div className="flex flex-col flex-1">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{g.name}</p>
                                <p className="text-[10px] text-slate-500">{g.members}</p>
                            </div>
                            <button className="text-primary text-[10px] font-bold uppercase tracking-tight">Join</button>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-4 py-2 text-slate-500 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    See all groups
                </button>
            </div>
        </div>
    );
};

// ─── Post Card ────────────────────────────────────────────────────────────────

interface PostCardProps {
    avatar: string;
    name: string;
    time: string;
    tag: string;
    content: string;
    media?: React.ReactNode;
    stats?: React.ReactNode;
    likes: number;
    comments: number;
    liked?: boolean;
}

const PostCard = ({ avatar, name, time, tag, content, media, stats, likes, comments, liked }: PostCardProps) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{ backgroundImage: `url("${avatar}")` }} />
                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">{name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                        {time} • <span className="text-primary font-medium">{tag}</span>
                    </p>
                </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">more_horiz</span>
            </button>
        </div>

        <div className="px-4 pb-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{content}</p>
        </div>

        {media}

        <div className="p-4">
            {stats && (
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4 mb-4">
                    {stats}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors">
                        <span className={`material-symbols-outlined text-[20px] ${liked ? 'text-primary' : ''}`}>
                            {liked ? 'favorite' : 'favorite_border'}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
                        <span className="text-xs font-medium">{comments} Comments</span>
                    </button>
                </div>
                <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    <span className="text-xs font-medium">Share</span>
                </button>
            </div>
        </div>
    </div>
);

// ─── Feed Column ──────────────────────────────────────────────────────────────

const FeedColumn = () => (
    <div className="lg:col-span-6 flex flex-col gap-6">
        {/* Share Update */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex gap-4">
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                    style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7RO0RfVtyV53RbN0xoI6F9q8j28iyQk4aGZt7yPn3YsOZZTQ_C5jtzsnin4uHA1SjROrBF8uwFMIgc3aRlEMNdZ-ZDPzqmsD-HRhGRD7oKgxihGUzFPAtfEeUZuBx3IWBI6Mbv09jPm4MMp4B1jQpKkkGmpEbmZaDBaeVcJdLxA5RKvY_3PCYXVmvyJfOpFrVtKO74rPsyf184YnipJ1A4i6mLMzjiuTrbvKaTsAHxeytL8Kq6gkfvPr7TTn9-mMPUasCxmUag6A")` }}
                />
                <div className="flex-1 flex flex-col">
                    <textarea
                        className="w-full min-h-[100px] border-none focus:ring-0 bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none"
                        placeholder="Share your workout or progress..."
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-2">
                            {['image', 'video_library', 'location_on', 'bar_chart'].map((icon) => (
                                <button key={icon} className="p-2 rounded-lg text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">{icon}</span>
                                </button>
                            ))}
                        </div>
                        <button className="bg-primary text-slate-900 px-6 py-2 rounded-lg text-sm font-bold shadow-sm shadow-primary/20 hover:brightness-105">
                            Post
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Feed Filter */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
            <button className="border-b-2 border-primary text-slate-900 dark:text-white pb-3 text-sm font-bold">All Posts</button>
            <button className="text-slate-500 dark:text-slate-400 pb-3 text-sm font-medium hover:text-slate-800">Following</button>
            <button className="text-slate-500 dark:text-slate-400 pb-3 text-sm font-medium hover:text-slate-800">Trending</button>
        </div>

        {/* Post 1 - Sarah Miller */}
        <PostCard
            avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuB4xlgajQcu6Q8HvFhcaU2OVj_VmQB4tNJvd_qT2P60NhtnGCB4E3TZCOztIypp6F79zin69uNtT1-bs-h_ckZLmwnquslGhAxcZDjx-aAtkhs5Gw47iFIsCMCZxU8qc6e-ZWk_w_wiw29-5CtpxPqjfxCpKuw-0_i8CbF3_F4H0VJMNZtfAae9tTxqSyi80aql60nJzX08XlCaY-28PEFRB_RD76fCqLcDwCme_pWkjDjIFLSWdsAVQlLQPUucMwHIUlWhPZ7SKtE"
            name="Sarah Miller"
            time="2 hours ago"
            tag="Cardio Session"
            content="Finally hit my goal of running 10km under 50 minutes! The training plan from AI HealthMate really paid off today. Feel invincible! 🏃‍♀️✨"
            liked
            likes={124}
            comments={18}
            media={
                <div
                    className="aspect-video bg-center bg-cover"
                    style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuB_mUzECakkvQlckzWYCDuU-73-FUPZFEq_8J5DNFtNpIbUb0g5rPoeLOGO8r5IJ93AEtfwZjR0kgBCmOqKNdvVkt0erqlSB9n8_BakFSb2OWCnkBpXws11F2B-K61LuGgXkNdXimHSNmJkunvMcoS6Tewid4gSSJTeNR36nd0HARCS4qY2N9VKES5BJtGIJTIepLoUFfjw7QKOJFSk-DusUY3F_Bgv85OviQVLombGGKbjJaf8lqrGHuw_2AOJ8BATq0qLiTEtSuU")` }}
                />
            }
            stats={
                <>
                    <div className="flex gap-4">
                        {[
                            { label: 'Distance', value: '10.2 km' },
                            { label: 'Time', value: '48:12' },
                            { label: 'Avg Pace', value: "4'43\" /km" },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col items-center px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] text-slate-500 font-medium">{label}</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                            </div>
                        ))}
                    </div>
                    <button className="bg-primary/20 text-slate-900 dark:text-slate-100 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary transition-colors">
                        Details
                    </button>
                </>
            }
        />

        {/* Post 2 - Marcus Reed */}
        <PostCard
            avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBs1qAlnCtUcQ4QT6cH_B-GWWcpde5QsHAhw6EZgCAPSDGRMAqU7VklBArO2ab1VdSIqRzBGyeXJuk5kFYOzppx3rpRn2wOi0uYZzq0fNGWNg-xWmQTa54sPSd5nLqymmzdIbCU32BWk2rmReaFgtx1keXJsvM3rB7e6H4XxY5Ogr4dyM-MLUey2ws5Xjv-XM2BR0NVU0SX-loJ_KNt6thCXthfYMqlRETXxNPS5HLDERRnU7tZaHuCOXFcixfocoi9MeUvz8ksXgc"
            name="Marcus Reed"
            time="4 hours ago"
            tag="Nutrition Update"
            content="Meal prep for the week is done! Focusing on high-protein, clean ingredients to support the new heavy lifting block. 🥦🥩"
            likes={56}
            comments={4}
            media={
                <div className="grid grid-cols-2 gap-0.5 aspect-video overflow-hidden">
                    <div className="bg-center bg-cover" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuD3VjEz3hh5Jfc1gap3CQuILGlcYDRAqle2iqNHUAPaySLZC9au8SZ7p_EV8i57vfCLMsvK0es5P0cL_2u2NRsGb0k0Wo177xVwl7H9OmWbRO1BeXUw47uaT-vjA7ynngqY_yIdm2YfR81Y4pUj8SWgPFTyPRxZ_Mq0CdlAKSpq9t9opgeTvLtXVA2QR9KVdUsRdsknfVgrM_7gYPGE8hq4MPHhBBMbvZgJn0WycpW8js3YoD3VBpRc7nrakOZVMaRYRj7KwZkIVVU")` }} />
                    <div className="bg-center bg-cover" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCYcFzhnESZaOj9gdSrBpu-dUO_EFjxWOrhltP-wiKr5_laKuINgKXfSmiMwAwu7S2tI6UYMr3OaMfQ_gqNjcqP6EXaGl4CtcIIQtus-r10OhjizvSr2nwfXx4OCy2Ox0lL0TydRcuHIkCJRSm0Qh3SO0DNFJhjwZkK5KtJQK9xyZo_ulKFRg-748UzvsQc3x1wup-lR3R-CVOeCX35cMHKIHZaNOZBvD76KfS1nsBxWrMl8r7D5pu4u6P3-ISeffSNZiM3tLT35QE")` }} />
                </div>
            }
        />
    </div>
);

// ─── Right Sidebar ────────────────────────────────────────────────────────────

const RightSidebar = () => {
    const leaderboard: LeaderboardItem[] = [
        { rank: 1, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcjkQBnOaumIKeDXUPTT4EieaZjv_NksbCbOmpDGowGcHXzeLf7MTU2mRwQ9NdS8Mx-pFMSpTbMR0ddqc6EQT1KBfQpfSM2LsIIW9iq012--1XVRDSjPW3ymAhi19NEIc9QUzbxroNMDt1BagMud_i0tdYeYbO8NYDVzZdD5BLtLAtCChmQbZTrO-8CyXt56mHTqQY9uZUI7-tIgodO04W69Pwi4OULbOJdbsdeKpAutbmdRlZPWoVW-8_sU80YIHanXjaOFdE5JE', name: 'David Chen', points: '4,280 points', isTop: true },
        { rank: 2, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-95zwzE9QfZmah-Xgyar4NKC3L009P03oIOCR5kLsPkOKgaion9ZNnfxjl6nn0Uo3Y36lZq1jedvYz-Tn5qOWXyiSyEalmhMncYVrQ_ULYt8LAmaciL70Wwj0alZLAH0kxOr4skGNe_eEX1PUijx2H-hUiuODBMvEFfpoOY5CdISEgDf3NCwfj9XT4Dk3XfXKmLVOOE5ROLvzYEKeRQ0Cb0MLR7DqdioUuCGaIuEJbMJWwzT8ySg2kA5uid54b41IMc2JYEDs3B4', name: 'Sarah Miller', points: '3,950 points' },
        { rank: 3, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzm5PlConFg9yirdiPHws45MqXQI6QIQu0-T36O1UyIHE1gapu4Now5DBZMqY4RabdjOF1Ai6ZsXgyX2-9GextxFtuktq7ton_WB97ruybQTZUha43xAgQFvJYJ6MXj-isZnQJHjf3xX8IgC3uF_oUnp1glNeXKdPFbantASKPSlxVZxO0qOSwGsbJIDsjIs6nG6xFk0G64jsN8ZWdPcMwu8hW0z2CDAf2v5D8pFmSPNFK7kjrAMbXjREPyfBZL7B_Q4uM7rmKuw4', name: 'You (Alex)', points: '3,720 points' },
        { rank: 4, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDX4McWguKa0VYHuGptbZMGU92IbrVmVq_NCqyGEaIwElQVXF6-ZP3-Q82EaELo7xcUQ3I-983NRpBSyGZaUq1YMd7oBOtvPIYQGXeAelJexgRMZwIBXQQh3QDlaWqgaLiDGwXqLvfxzcRXsGtYzTa7dEPAvUFYHbgp1A9N1kc0_5G1TRFDGo-YVno5DQ2ofkVFnt6hXWeViGiP_O-ZUPYpkY2LLV42YqBEq0v0AMii4-L1qtnc8qu1yHw-1l9k3Sb2HTgDwDJkuhk', name: 'Chris Evans', points: '3,200 points' },
    ];

    const suggested: SuggestedFriend[] = [
        { avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPIEVK8uqQD6HSir3SLg0ajUE-xHxMD-MZeilxEv3Sq1YhPh7zm9oIzaVqHHAfBJT0XxS6aG7-GpeIkvq0y9sD-U3rbRFVrKFXz49q524cy6TouJuNTq-60MnF2vvKBuXJRNMX7GSwt7UiCbRqXjvBmGbetURSgaAn1yQEeb_FAIjv2A5aEY8TFQqxnwWQpOiHlq1sR92jI8oxjNa_cM8QFKR2jBQWZ6pkLfFeB-OmR0g8nF_Iv8bYhESj-iJqf8jf9ol3lYrQnv4', name: 'Emma Watson', reason: 'Both love Pilates' },
        { avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm0j_lcCkHPgscDPNGRKUR7H5w0JOvaFSzSumPK69DGcErYIMZ5QhBjeNc3riTddgsa0aYQYd2gL8Nn99b9EVMsG7JdBZOPuj-QOx5vjHqWehKAvtuEzotAuNTIcgxK5oOYlLYHr9_HYKAaae6e8KiHuzQhGS3dec-sUzTYMIfbUtj7-nqxQR3FbCfJ1iQzWzZNQrzdUGqhP3JK5S_-kxIQ_9qClJB7t-MbHCnpDA7PFw0dS-QcrahIkRypxuUt2jf5Vp7OAjn6AM', name: 'Mike Ross', reason: '4 mutual friends' },
    ];

    return (
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
            {/* Leaderboard */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-slate-900 dark:text-white font-bold text-sm">Leaderboard</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button className="text-[10px] font-bold px-2 py-1 rounded bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">Friends</button>
                        <button className="text-[10px] font-bold px-2 py-1 text-slate-500">Global</button>
                    </div>
                </div>
                <div className="p-2">
                    {leaderboard.map((item) => (
                        <div
                            key={item.rank}
                            className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${item.isTop
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className={`text-xs font-bold w-4 ${item.isTop ? 'text-primary' : 'text-slate-400'}`}>{item.rank}</span>
                            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8" style={{ backgroundImage: `url("${item.avatar}")` }} />
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                                <p className="text-[10px] text-slate-500">{item.points}</p>
                            </div>
                            {item.isTop && <span className="material-symbols-outlined text-amber-400 text-[18px]">workspace_premium</span>}
                        </div>
                    ))}
                </div>
                <button className="w-full py-4 text-primary text-xs font-bold border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-b-xl">
                    View full ranking
                </button>
            </div>

            {/* Suggested Friends */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-4">Suggested for you</h3>
                <div className="flex flex-col gap-4">
                    {suggested.map((f) => (
                        <div key={f.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{ backgroundImage: `url("${f.avatar}")` }} />
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{f.name}</p>
                                    <p className="text-[10px] text-slate-500">{f.reason}</p>
                                </div>
                            </div>
                            <button className="text-primary">
                                <span className="material-symbols-outlined text-[20px]">person_add</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Community Feed Page ───────────────────────────────────────────────────────

const CommunityFeed = () => (
    <div>
        <Navbar />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
            <LeftSidebar />
            <FeedColumn />
            <RightSidebar />
        </div>
        <Footer />
    </div>

);

export default CommunityFeed;